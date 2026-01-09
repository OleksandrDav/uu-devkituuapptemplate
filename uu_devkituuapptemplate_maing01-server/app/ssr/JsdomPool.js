"use strict";

const JsdomInitializer = require("./JsdomInitializer.js");
const { AsyncBlockingQueue } = require("./AsyncBlockingQueue.js");

/**
 * JsdomPool
 * ---------
 * Manages a group of pre-loaded JSDOM instances to speed up SSR.
 *
 * Performance Note:
 * Creating a new JSDOM instance takes ~2000ms. By keeping a pool of already
 * started instances, we can provide a browser environment in ~0ms.
 */
class JsdomPool {
  /**
   * @param {object} config
   * @param {string} config.frontDistPath - Path to the public folder.
   * @param {string} config.indexHtml - The HTML file to load (index.html).
   * @param {number} config.minInstances - How many instances to keep ready.
   * @param {number} config.maxUses - How many times an instance is used before being replaced.
   */
  constructor({ frontDistPath, indexHtml, minInstances = 2, maxUses = 50 }) {
    this.config = { frontDistPath, indexHtml, minInstances, maxUses };
    this.pool = []; // List of all active instances
    this.queue = new AsyncBlockingQueue(); // Manages the order of requests
    this.isInitialized = false;
  }

  /**
   * Initializes the pool by creating the minimum number of instances.
   * This should be called ONLY when the server is ready (lazy init).
   */
  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log(`[JsdomPool] Starting ${this.config.minInstances} initial instances...`);

    // CRITICAL FIX: Create instances SEQUENTIALLY to avoid CSS race conditions
    // Parallel creation can cause Emotion to generate styles inconsistently
    for (let i = 0; i < this.config.minInstances; i++) {
      await this._createNewInstance();
      // Small delay between instances to ensure clean CSS state
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`[JsdomPool] Pool is ready.`);
  }

  /**
   * INTERNAL: Creates a fresh JSDOM instance and adds it to the queue.
   * We use a dummy URL to ensure the instance has a consistent origin for network calls.
   */
  async _createNewInstance() {
    const dummyUrl = "http://localhost:8080/uu-devkituuapptemplate-maing01/dd1ff736deaf5a3497ac5d3f7fa8c87f/home";

    const initializer = new JsdomInitializer(this.config.frontDistPath, this.config.indexHtml, {
      url: dummyUrl,
    });

    try {
      const dom = await initializer.run();

      // ⚠️ CRITICAL: Wait for the instance to complete its initial render
      // before making it available to requests. This prevents serving
      // half-loaded instances on the first request.
      await this._waitForInitialStability(dom.window);

      // ⚠️ CRITICAL CSS FIX: Add extra delay to ensure Emotion has fully
      // written styles to CSSOM before lifting them
      await new Promise((resolve) => setTimeout(resolve, 300));

      // ⚠️ CRITICAL CSS FIX: Lift Emotion styles IMMEDIATELY after initialization
      // This ensures CSS is properly captured before the instance is used
      await this._liftEmotionStyles(dom.window);

      // Attach metadata to track the age and usage of the instance
      dom._poolMeta = {
        usageCount: 0,
        id: Math.random().toString(36).substring(7),
        createdAt: Date.now(),
      };

      this.pool.push(dom);
      this.queue.enqueue(dom);

      console.log(`[JsdomPool] Instance ${dom._poolMeta.id} is ready and stable.`);
      return dom;
    } catch (e) {
      console.error("[JsdomPool] Failed to create JSDOM instance:", e);
    }
  }

  /**
   * Lifts Emotion CSS from CSSOM to DOM so it survives serialization.
   * This must be called after initial render and before each serialization.
   *
   * @param {Window} window - The JSDOM window object
   */
  async _liftEmotionStyles(window) {
    return new Promise((resolve) => {
      // Use setImmediate to ensure we're lifting AFTER React has finished
      // all its microtask work and Emotion has written to CSSOM
      setImmediate(() => {
        try {
          const styleTags = window.document.querySelectorAll("style[data-emotion]");
          let liftedCount = 0;
          let totalRules = 0;

          styleTags.forEach((tag) => {
            if (tag.sheet && tag.sheet.cssRules) {
              try {
                let rules = "";
                const cssRules = tag.sheet.cssRules;
                for (let i = 0; i < cssRules.length; i++) {
                  rules += cssRules[i].cssText + "\n";
                }

                // Only update if we found rules and the tag is empty or needs updating
                if (rules && rules.trim() !== tag.textContent.trim()) {
                  tag.textContent = rules;
                  liftedCount++;
                  totalRules += cssRules.length;
                }
              } catch (e) {
                console.warn(`[JsdomPool] Style lift failed for ${tag.getAttribute("data-emotion")}:`, e.message);
              }
            }
          });

          if (liftedCount > 0) {
            console.log(`[JsdomPool] ✓ Lifted ${liftedCount} Emotion style tags (${totalRules} rules)`);
          } else {
            console.warn(`[JsdomPool] ⚠️ No styles lifted - this may indicate a timing issue`);
          }

          resolve();
        } catch (e) {
          console.error("[JsdomPool] CSS lifting error:", e);
          resolve(); // Don't block even if lifting fails
        }
      });
    });
  }

  /**
   * Waits for a newly created JSDOM instance to finish its initial render.
   * This prevents serving half-loaded instances on the first request.
   *
   * @param {Window} window - The JSDOM window object
   * @returns {Promise<void>}
   */
  _waitForInitialStability(window) {
    return new Promise((resolve) => {
      // Check if already stable (no loading indicator present)
      if (!window.document.getElementById("uuAppLoading")) {
        console.log("[JsdomPool] Instance already stable");
        // Small buffer to ensure React is fully settled
        setTimeout(resolve, 100);
        return;
      }

      const start = Date.now();
      const interval = setInterval(() => {
        // Check if the loading indicator has been removed
        if (!window.document.getElementById("uuAppLoading")) {
          clearInterval(interval);
          const elapsed = Date.now() - start;
          console.log(`[JsdomPool] Instance became stable after ${elapsed}ms`);
          // Small buffer to ensure React and Emotion are fully settled
          setTimeout(resolve, 150);
          return;
        }

        // Safety timeout to prevent hanging (increase if your app takes longer to boot)
        if (Date.now() - start > 10000) {
          clearInterval(interval);
          console.warn("[JsdomPool] Instance stability timeout after 10s - proceeding anyway");
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Takes an available instance from the pool.
   * If all instances are busy, it waits until one is released.
   * @returns {Promise<JSDOM>}
   */
  async acquire() {
    const dom = await this.queue.dequeue();
    dom._poolMeta.usageCount++;
    return dom;
  }

  /**
   * Returns an instance back to the pool after the request is finished.
   * If the instance has reached 'maxUses', it is closed and a new one is created.
   * @param {JSDOM} dom - The instance to return.
   */
  async release(dom) {
    if (!dom) return;

    // Check if the instance should be replaced to prevent memory leaks
    if (dom._poolMeta.usageCount >= this.config.maxUses) {
      console.log(`[JsdomPool] Instance ${dom._poolMeta.id} reached usage limit. Replacing...`);

      // Remove from the list of active instances
      const index = this.pool.indexOf(dom);
      if (index > -1) this.pool.splice(index, 1);

      // Close the window to free up memory
      try {
        dom.window.close();
      } catch (e) {
        console.warn("[JsdomPool] Error closing window during replacement:", e);
      }

      // Create a new fresh instance to take its place
      this._createNewInstance();
    } else {
      // Cleanup: Remove injected data so the next request starts clean
      if (dom.window.__INITIAL_DATA__) {
        delete dom.window.__INITIAL_DATA__;
      }

      // Make the instance available for the next request
      this.queue.enqueue(dom);
    }
  }
}

module.exports = JsdomPool;
