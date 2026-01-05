"use strict";

const path = require("path");
const fs = require("fs");
const JsdomPool = require("../ssr/JsdomPool.js");
const routeRegistry = require("../ssr/route-registry.js");

// Configure the JSDOM instance pool.
// Initialization is deferred to the first request to ensure the host server
// is fully operational and the port is bound before environment setup.
const ssrPool = new JsdomPool({
  frontDistPath: path.join(process.cwd(), "public"),
  indexHtml: "index.html",
  minInstances: 2,
  maxUses: 50,
});

const MIDDLEWARE_ORDER = -101;

/**
 * SsrMiddleware
 * -------------
 * Manages the Server-Side Rendering lifecycle by intercepting HTML requests
 * and utilizing a pre-initialized pool of JSDOM environments.
 */
class SsrMiddleware {
  constructor() {
    this.order = MIDDLEWARE_ORDER;
  }

  async pre(req, res, next) {
    // -------------------------------------------------------------------------
    // STEP 1: REQUEST FILTERING
    // -------------------------------------------------------------------------

    // Ignore source maps and non-GET requests
    if (req.url.endsWith(".map")) {
      res.statusCode = 404;
      res.end();
      return;
    }
    if (req.method !== "GET") return next();

    // Exclude static assets and binary files from SSR processing
    if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|json|woff|woff2|ttf|map)$/)) {
      return next();
    }

    // Bypass SSR for API, OIDC, and system-level endpoints
    if (
      req.url.includes("/oidc/") ||
      req.url.includes("/sys/") ||
      req.url.includes("/api/") ||
      req.url.includes("/rocket/") ||
      req.url.includes("getClientId") ||
      req.url.includes("grantToken") ||
      req.url.includes("initUve") ||
      req.url.includes("loadData")
    ) {
      return next();
    }

    // -------------------------------------------------------------------------
    // STEP 2: INTERNAL RESOURCE RESOLUTION
    // -------------------------------------------------------------------------
    // Resolve static assets requested by JSDOM instances that may not be
    // accessible via standard routing during the internal rendering cycle.
    if (req.url.includes("/public/")) {
      const cleanUrl = req.url.split("?")[0];
      const parts = cleanUrl.split("/public/");
      const relativePathWithVersion = parts.length > 1 ? parts.pop() : parts[0];
      const filename = path.basename(relativePathWithVersion);
      const filePath = path.join(process.cwd(), "public", filename);

      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const mime =
          {
            ".js": "application/javascript",
            ".css": "text/css",
            ".json": "application/json",
          }[ext] || "application/octet-stream";

        res.setHeader("Content-Type", mime);
        res.setHeader("Cache-Control", "public, max-age=3600");
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }

    // Verify the request explicitly accepts HTML content
    if (!req.headers.accept || !req.headers.accept.includes("text/html")) {
      return next();
    }

    // [DEBUG] If we get here, SSR is attempting to run
    console.log(`[SSR] 🟢 Starting Pipeline for: ${req.url}`);

    try {
      // -----------------------------------------------------------------------
      // STEP 3: DEFERRED POOL INITIALIZATION
      // -----------------------------------------------------------------------
      // Ensures the application pool is warmed up only after the server is active.
      if (!ssrPool.isInitialized) {
        console.log("[SSR] Initial request detected. Initializing resource pool...");
        await ssrPool.init();
      }

      // -----------------------------------------------------------------------
      // STEP 4: DATA PRE-FETCHING
      // -----------------------------------------------------------------------
      // Execute data loaders defined in the Route Registry for the requested path.
      const requestPath = (req.originalUrl || req.url).split("?")[0];

      let preFetchedData = null;
      const loader = routeRegistry[requestPath];

      if (loader) {
        try {
          console.log(`[SSR] Executing loader for ${requestPath}`);
          preFetchedData = await loader();
          console.log(`[SSR] Data pre-fetched successfully.`);
        } catch (e) {
          console.error(`[SSR] Data pre-fetch error: ${e.message}`);
        }
      } else {
        console.log(`[SSR] ⚠️ No data loader found for path: ${requestPath}`);
      }

      // -----------------------------------------------------------------------
      // STEP 5: RESOURCE ACQUISITION
      // -----------------------------------------------------------------------
      // Retrieve an idle JSDOM environment from the pool.
      const dom = await ssrPool.acquire();
      const window = dom.window;

      // --- IDENTITY SYNC ---
      // Dynamically set the identity to match the person requesting the page
      // Use your specific identity discovered in the logs
      const visitorId = req.headers["x-uu-identity"] || "0-0";

      window.uuAppSession = {
        isAuthenticated: () => visitorId !== "0-0",
        getIdentity: () => ({ uuIdentity: visitorId, name: "SSR Visitor" }),
      };

      // -----------------------------------------------------------------------
      // STEP 6: STATE INJECTION
      // -----------------------------------------------------------------------
      // 1. Synchronize the pre-fetched state with the running JSDOM instance.
      window.__INITIAL_DATA__ = preFetchedData;

      // 2. Append the state to the document for client-side hydration.
      let dataScript = window.document.getElementById("ssr-data-script");
      if (!dataScript) {
        dataScript = window.document.createElement("script");
        dataScript.id = "ssr-data-script";
        window.document.body.appendChild(dataScript);
      }
      dataScript.textContent = `window.__INITIAL_DATA__ = ${preFetchedData ? JSON.stringify(preFetchedData) : "null"};`;

      // -----------------------------------------------------------------------
      // STEP 7: ROUTE SYNCHRONIZATION
      // -----------------------------------------------------------------------
      // Navigate the existing JSDOM environment to the requested application route.
      const routeName = this._extractRouteName(requestPath);

      if (window.__SSR_SET_ROUTE__) {
        window.__SSR_SET_ROUTE__(routeName);
        // Give React a "micro-task" tick to process the state update in JSDOM
        await new Promise((resolve) => setImmediate(resolve));
      }

      // -----------------------------------------------------------------------
      // STEP 8: SERIALIZATION & STABILITY
      // -----------------------------------------------------------------------
      // Wait for the framework to finish rendering before capturing the HTML string.
      await this._waitForStability(window);

      // --- CSS LIFTING ---
      // Manually copy rules from the virtual sheet to the tag's innerHTML
      const styleTags = window.document.querySelectorAll("style[data-emotion]");
      styleTags.forEach((tag) => {
        if (tag.innerHTML.trim() === "" && tag.sheet) {
          try {
            let rules = "";
            const cssRules = tag.sheet.cssRules;
            for (let i = 0; i < cssRules.length; i++) {
              rules += cssRules[i].cssText + "\n";
            }
            if (rules) {
              tag.textContent = rules;
            }
          } catch (e) {
            // Log if extraction fails for a specific tag
            console.warn(`[SSR] Style lift failed for ${tag.getAttribute("data-emotion")}:`, e.message);
          }
        }
      });

      // Manually hide the loader before serializing
      const loadingEl = window.document.getElementById("uuAppLoading");
      if (loadingEl) loadingEl.style.display = "none";

      const html = dom.serialize();

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.writeHead(200);
      res.write(html);
      res.end();

      // Return the JSDOM instance to the pool for reuse.
      ssrPool.release(dom);
    } catch (error) {
      console.error(`[SSR] 💥 Pipeline failed:`, error);
      // Fallback to client-side rendering on pipeline failure.
      return next();
    }
  }

  /**
   * Maps the request URL path to the corresponding application route name.
   */
  _extractRouteName(fullPath) {
    // FIX: Remove query params before splitting
    const cleanPath = fullPath.split("?")[0];
    const parts = cleanPath.split("/");
    const segments = parts.filter((p) => p);
    const last = segments[segments.length - 1];
    if (["home", "contact"].includes(last)) return last;
    return "home";
  }

  /**
   * Polls the JSDOM document until the framework's loading indicator is removed,
   * signaling that the UI is stable and ready for serialization.
   */
  _waitForStability(window) {
    return new Promise((resolve) => {
      // Immediate resolution if the environment is already stable.
      if (!window.document.getElementById("uuAppLoading")) {
        setTimeout(resolve, 50);
        return;
      }

      const start = Date.now();
      const interval = setInterval(() => {
        if (!window.document.getElementById("uuAppLoading")) {
          clearInterval(interval);
          resolve();
        }
        // Safety timeout to prevent request hanging.
        if (Date.now() - start > 2000) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }
}

module.exports = SsrMiddleware;
