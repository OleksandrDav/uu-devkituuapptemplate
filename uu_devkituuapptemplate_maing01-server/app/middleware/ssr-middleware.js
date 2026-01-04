"use strict";

const path = require("path");
const fs = require("fs");
const JsdomPool = require("../ssr/JsdomPool.js");
const routeRegistry = require("../ssr/route-registry.js");

// Configure the JSDOM instance pool.
const ssrPool = new JsdomPool({
  frontDistPath: path.join(process.cwd(), "public"),
  indexHtml: "index.html",
  minInstances: 2,
  maxUses: 50,
});

const MIDDLEWARE_ORDER = -101;

class SsrMiddleware {
  constructor() {
    this.order = MIDDLEWARE_ORDER;
  }

  async pre(req, res, next) {
    // [DEBUG] 1. Log every incoming request to see if Middleware is active
    console.log(`[SSR Debug] Checking: ${req.url}`);

    // -------------------------------------------------------------------------
    // STEP 1: REQUEST FILTERING
    // -------------------------------------------------------------------------
    if (req.url.endsWith(".map")) {
      res.statusCode = 404;
      res.end();
      return;
    }
    if (req.method !== "GET") return next();

    if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|json|woff|woff2|ttf|map)$/)) {
      return next();
    }

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
      console.log(`[SSR Debug] Bypassing System/Auth Request: ${req.url}`);
      return next();
    }

    // -------------------------------------------------------------------------
    // STEP 2: INTERNAL RESOURCE RESOLUTION
    // -------------------------------------------------------------------------
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

    // Verify HTML acceptance
    if (!req.headers.accept || !req.headers.accept.includes("text/html")) {
      return next();
    }

    // [DEBUG] 2. If we get here, SSR is attempting to run
    console.log(`[SSR] 🟢 Starting Pipeline for: ${req.url}`);

    try {
      // -----------------------------------------------------------------------
      // STEP 3: POOL INIT
      // -----------------------------------------------------------------------
      if (!ssrPool.isInitialized) {
        console.log("[SSR] Initial request detected. Initializing resource pool...");
        await ssrPool.init();
      }

      // -----------------------------------------------------------------------
      // STEP 4: DATA PRE-FETCHING
      // -----------------------------------------------------------------------
      // FIX: Remove query parameters to match routeRegistry keys exactly
      const requestPath = (req.originalUrl || req.url).split("?")[0];

      let preFetchedData = null;
      const loader = routeRegistry[requestPath];

      if (loader) {
        try {
          console.log(`[SSR] 📥 Executing loader for ${requestPath}`);
          preFetchedData = await loader();
          console.log(`[SSR] ✅ Data pre-fetched successfully.`);
        } catch (e) {
          console.error(`[SSR] ❌ Data pre-fetch error: ${e.message}`);
        }
      } else {
        console.log(`[SSR] ⚠️ No data loader found for path: ${requestPath}`);
      }

      // -----------------------------------------------------------------------
      // STEP 5: RESOURCE ACQUISITION
      // -----------------------------------------------------------------------
      const dom = await ssrPool.acquire();
      const window = dom.window;

      // --- IDENTITY SYNC ---
      // Dynamically set the identity to match the person requesting the page
      // Use your specific identity discovered in the logs
      const visitorId = req.headers["x-uu-identity"] || "7389-360-836-0000";

      window.uuAppSession = {
        isAuthenticated: () => visitorId !== "0-0",
        getIdentity: () => ({ uuIdentity: visitorId, name: "SSR Visitor" }),
      };

      // -----------------------------------------------------------------------
      // STEP 6: STATE INJECTION
      // -----------------------------------------------------------------------
      window.__INITIAL_DATA__ = preFetchedData;

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
      const routeName = this._extractRouteName(requestPath);

      if (window.__SSR_SET_ROUTE__) {
        window.__SSR_SET_ROUTE__(routeName);
        // Give React a "micro-task" tick to process the state update in JSDOM
        await new Promise((resolve) => setImmediate(resolve));
      }

      // -----------------------------------------------------------------------
      // STEP 8: SERIALIZATION & STABILITY
      // -----------------------------------------------------------------------
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

      ssrPool.release(dom);
    } catch (error) {
      console.error(`[SSR] 💥 Pipeline failed:`, error);
      return next();
    }
  }

  _extractRouteName(fullPath) {
    // FIX: Remove query params before splitting
    const cleanPath = fullPath.split("?")[0];
    const parts = cleanPath.split("/");
    const segments = parts.filter((p) => p);
    const last = segments[segments.length - 1];
    if (["home", "contact"].includes(last)) return last;
    return "home";
  }

  _waitForStability(window) {
    return new Promise((resolve) => {
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
        if (Date.now() - start > 2000) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }
}

module.exports = SsrMiddleware;
