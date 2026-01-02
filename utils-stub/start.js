const childProcess = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const http = require("node:http");
const { spawn, execSync } = require("node:child_process");
const localConfig = require("./local-config.json");
const { buildUuAppType, buildAsidUri, buildUuAppPath } = require("./helpers");

class Start {
  /**
   * Creates a new Start instance.
   * @param {Object} config - Optional configuration object. If not provided, uses local-config.json
   */
  constructor(config) {
    this.localConfig = config || localConfig;
  }

  /**
   * Builds the uuApp type string in the format: vendor-uuAppName-uuSubAppgeneration
   *
   * The format combines vendor, application name, sub-application name, and generation
   * into a single identifier used for routing and URI construction.
   * All components are normalized to lowercase.
   *
   * @returns {string} The formatted uuApp type string (e.g., "uu-myApp-maing01")
   */
  buildUuAppType() {
    return buildUuAppType(this.localConfig.uuApp);
  }

  /**
   * Builds absolute path to uu5lib project root folder (if present).
   *
   * In this template the uu5lib folder is named: {vendor}_{uuApp}{generation}-uu5lib
   * (e.g. uu_devkituuapptemplateg01-uu5lib).
   *
   * @returns {string} Absolute path to uu5lib root folder.
   */
  buildUu5LibPath() {
    const rootPath = path.join(__dirname, "..");
    const appNameShort = `${this.localConfig.uuApp.vendor}_${this.localConfig.uuApp.uuApp.toLowerCase()}${
      this.localConfig.uuApp.generation
    }`;
    return path.join(rootPath, `${appNameShort}-uu5lib`);
  }

  /**
   * Reads uu5lib dev server ports from workspace env/development.json files.
   * Falls back to [4920, 4930] if not readable.
   *
   * @returns {number[]} Port list.
   */
  getUu5LibPortList() {
    const appNameShort = `${this.localConfig.uuApp.vendor}_${this.localConfig.uuApp.uuApp.toLowerCase()}${
      this.localConfig.uuApp.generation
    }`;
    const uu5LibPath = this.buildUu5LibPath();
    const candidates = [
      path.join(uu5LibPath, `${appNameShort}`, "env", "development.json"),
      path.join(uu5LibPath, `${appNameShort}-core`, "env", "development.json"),
    ];

    const ports = [];
    for (const filePath of candidates) {
      try {
        if (!fs.existsSync(filePath)) continue;
        const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
        const port = Number(json?.port);
        if (Number.isFinite(port)) ports.push(port);
      } catch (e) {
        // ignore and use fallback below
      }
    }

    return ports.length ? [...new Set(ports)] : [4920, 4930];
  }

  /**
   * Builds the full ASID (Application SubApp Instance Data) URI.
   *
   * Constructs the complete base URI for accessing the ASID instance,
   * using the local development server and the uuApp type.
   *
   * @param {string} asid - The ASID identifier
   * @returns {string} The complete ASID base URI (e.g., "http://localhost:9090/uu-myapp-maing01/12345678901234567890123456789012")
   */
  buildAsidUri(asid) {
    return buildAsidUri(this.localConfig.uuApp.host, this.buildUuAppType(), asid);
  }

  /**
   * Checks if the uuApp server is currently running by attempting to connect to it.
   *
   * @param {number} timeout - Connection timeout in milliseconds (default: 2000)
   * @returns {Promise<boolean>} True if the server is running, false otherwise
   */
  async isUuAppRunning(timeout = 2000) {
    // uuApp needs to be checked on the inner port, not the gateway port, since the uuApp route will not be added to the gateway until uuApp is initialized
    const asidUri = this.buildAsidUri(this.localConfig.asid).replace("9090", this.localConfig.uuApp.innerPort);
    console.log(asidUri);

    return new Promise((resolve) => {
      const req = http.get(asidUri, { timeout }, (res) => {
        resolve(!!res.statusCode); // if res.statusCode is not undefined, then the server is running
        res.resume(); // Consume response to free up memory
      });

      req.on("error", () => {
        resolve(false);
      });

      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Checks if uu5lib dev server(s) are running by attempting to connect to their ports.
   *
   * @param {number} timeout - Connection timeout in milliseconds (default: 2000)
   * @returns {Promise<boolean>} True if at least one uu5lib port responds, false otherwise
   */
  async isUu5LibRunning(timeout = 2000) {
    const portList = this.getUu5LibPortList();

    const checks = portList.map(
      (port) =>
        new Promise((resolve) => {
          const req = http.get(`http://localhost:${port}`, { timeout }, (res) => {
            resolve(!!res.statusCode);
            res.resume();
          });
          req.on("error", () => resolve(false));
          req.on("timeout", () => {
            req.destroy();
            resolve(false);
          });
        }),
    );

    const results = await Promise.all(checks);
    return results.some(Boolean);
  }

  /**
   * Installs npm dependencies in the required project folders.
   * Similar to copy-uu-app.js installDependencies method.
   *
   * @returns {Promise<void>} Resolves when all dependencies are installed
   */
  async installDependencies() {
    const rootPath = path.join(__dirname, "..");
    const appNameFull = buildUuAppPath(this.localConfig.uuApp);
    const appNameShort = `${this.localConfig.uuApp.vendor}_${this.localConfig.uuApp.uuApp.toLowerCase()}${this.localConfig.uuApp.generation}`;

    // prepare folders to install dependencies and start
    const folders = [];
    if (this.localConfig.folderSuffixMap.server) {
      folders.push({
        path: path.join(rootPath, `${appNameFull}-${this.localConfig.folderSuffixMap.server}`),
        command: "npm install",
      });
    }
    if (this.localConfig.folderSuffixMap.uuscriptlib) {
      folders.push({
        path: path.join(rootPath, `${appNameFull}-${this.localConfig.folderSuffixMap.uuscriptlib}`),
        command: "npm install",
      });
    }
    if (this.localConfig.folderSuffixMap.hi) {
      folders.push({
        path: path.join(rootPath, `${appNameFull}-${this.localConfig.folderSuffixMap.hi}`),
        command: "npm install --legacy-peer-deps",
      });
    }
    if (this.localConfig.hasUu5Lib) {
      folders.push({ path: path.join(rootPath, `${appNameShort}-uu5lib`), command: "npm install" });
    }

    for (const folder of folders) {
      if (fs.existsSync(folder.path)) {
        console.log(`\nInstalling dependencies in ${folder.path}...`);
        try {
          execSync(folder.command, {
            cwd: folder.path,
            stdio: "inherit",
          });
          console.log(`✓ Completed: ${folder.path}`);
        } catch (error) {
          console.error(`✗ Failed to install dependencies in ${folder.path}:`, error.message);
          throw error;
        }
      } else {
        console.warn(`⚠ Folder not found, skipping: ${folder.path}`);
      }
    }
  }

  /**
   * Prepares the uuApp before starting by:
   * 1. Installing dependencies in required folders
   * 2. Ensuring development.json has the correct asid and asid_license_owner_list
   * 3. Running npm run package in the server folder
   * 4. Running npm run uploadScript in the uuscriptlib folder
   *
   * @returns {Promise<void>} Resolves when all preparation steps are complete
   */
  async prepareUuAppBeforeStart() {
    const rootPath = path.join(__dirname, "..");
    const appNameFull = buildUuAppPath(this.localConfig.uuApp);
    const serverPath = path.join(rootPath, `${appNameFull}-${this.localConfig.folderSuffixMap.server}`);
    const developmentJsonPath = path.join(serverPath, "env", "development.json");
    const uuscriptlibPath = path.join(rootPath, `${appNameFull}-${this.localConfig.folderSuffixMap.uuscriptlib}`);

    // Step 1: Install dependencies
    console.log("Installing dependencies...");
    await this.installDependencies();

    // Step 2: Update development.json with correct asid and asid_license_owner_list
    console.log("Updating development.json configuration...");
    let developmentConfig = JSON.parse(fs.readFileSync(developmentJsonPath, "utf8"));

    // Ensure asid matches localConfig
    if (developmentConfig.asid !== this.localConfig.asid) {
      console.log(`Updating asid from ${developmentConfig.asid} to ${this.localConfig.asid}`);
      developmentConfig.asid = this.localConfig.asid;
    }

    // Ensure uuIdentity is in asid_license_owner_list
    if (!developmentConfig.asid_license_owner_list || !Array.isArray(developmentConfig.asid_license_owner_list)) {
      console.log(`Setting asid_license_owner_list to [${this.localConfig.uuIdentity}]`);
      developmentConfig.asid_license_owner_list = [this.localConfig.uuIdentity];
    } else if (!developmentConfig.asid_license_owner_list.includes(this.localConfig.uuIdentity)) {
      console.log(`Updating asid_license_owner_list to [${this.localConfig.uuIdentity}]`);
      developmentConfig.asid_license_owner_list = [this.localConfig.uuIdentity];
    }

    // Write updated config back to file
    fs.writeFileSync(developmentJsonPath, JSON.stringify(developmentConfig, null, 2));
    console.log("development.json updated successfully");

    // Step 3: Run npm run package in server folder
    console.log("Running npm run package in server folder...");
    try {
      execSync("npm run package", {
        cwd: serverPath,
        stdio: "inherit",
      });
      console.log("npm run package completed successfully");
    } catch (error) {
      throw new Error(`Failed to run npm run package in server folder: ${error.message}`);
    }

    // Step 4: Run npm run uploadScript in uuscriptlib folder
    console.log("Running npm run uploadScript in uuscriptlib folder...");
    try {
      execSync("npm run uploadScript", {
        cwd: uuscriptlibPath,
        stdio: "inherit",
      });
      console.log("npm run uploadScript completed successfully");
    } catch (error) {
      throw new Error(`Failed to run npm run uploadScript in uuscriptlib folder: ${error.message}`);
    }
  }

  /**
   * Starts the uuApp server by running `npm start` in the server folder in a new shell.
   *
   * The server is started in a detached process so it continues running after this script exits.
   *
   * @returns {Promise<void>} Resolves when the server process has been started
   */
  async startUuApp() {
    const rootPath = path.join(__dirname, "..");
    const appNameFull = buildUuAppPath(this.localConfig.uuApp);
    const serverPath = path.join(rootPath, `${appNameFull}-${this.localConfig.folderSuffixMap.server}`);
    console.log(`Starting uuApp server from ${serverPath}`);

    const platform = os.platform();
    let command, args;

    if (platform === "win32") {
      // Windows: use cmd.exe with npm start in a new window
      command = "cmd.exe";
      args = ["/c", "start", "cmd.exe", "/k", "npm start"];
    } else {
      // Unix-like: use sh
      command = "sh";
      args = ["-c", "npm start"];
    }

    const serverProcess = spawn(command, args, {
      cwd: serverPath,
      detached: true,
      stdio: "ignore",
      shell: false,
    });

    // Unref the process so it doesn't keep the parent process alive
    serverProcess.unref();

    console.log("uuApp server process being started..., waiting for it to be running...");
  }

  /**
   * Starts uu5lib dev server by running `npm start` in the uu5lib folder in a new shell.
   *
   * @returns {Promise<void>}
   */
  async startUu5Lib() {
    const uu5LibPath = this.buildUu5LibPath();
    console.log(`Starting uu5lib from ${uu5LibPath}`);
    if (!fs.existsSync(uu5LibPath)) {
      throw new Error(
        `uu5lib folder not found at ${uu5LibPath}. Set hasUu5Lib=false or add the uu5lib project folder.`,
      );
    }

    const platform = os.platform();
    let command, args;

    if (platform === "win32") {
      command = "cmd.exe";
      args = ["/c", "start", "cmd.exe", "/k", "npm start"];
    } else {
      command = "sh";
      args = ["-c", "npm start"];
    }

    const libProcess = spawn(command, args, {
      cwd: uu5LibPath,
      detached: true,
      stdio: "ignore",
      shell: false,
    });

    libProcess.unref();
    console.log("uu5lib process being started..., waiting for it to be running...");
  }

  /**
   * Waits for uu5lib dev server to be running by polling its port(s).
   *
   * @param {number} maxWaitTime - Maximum time to wait in milliseconds (default: 60000)
   * @param {number} pollInterval - Interval between checks in milliseconds (default: 1000)
   * @returns {Promise<void>}
   */
  async waitForUu5LibRunning(maxWaitTime = 60000, pollInterval = 1000) {
    const startTime = Date.now();
    console.log("Waiting for uu5lib to be running...");

    while (Date.now() - startTime < maxWaitTime) {
      if (await this.isUu5LibRunning()) {
        console.log("uu5lib is running");
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`uu5lib did not start within ${maxWaitTime}ms`);
  }

  /**
   * Waits for the uuApp server to be running by polling the gateway endpoint.
   *
   * @param {number} maxWaitTime - Maximum time to wait in milliseconds (default: 60000 = 60 seconds)
   * @param {number} pollInterval - Interval between checks in milliseconds (default: 1000 = 1 second)
   * @returns {Promise<void>} Resolves when the server is running, or rejects if timeout is reached
   * @throws {Error} If the server doesn't start within the maximum wait time
   */
  async waitForUuAppRunning(maxWaitTime = 60000, pollInterval = 1000) {
    const startTime = Date.now();
    console.log("Waiting for uuApp server to be running...");

    while (Date.now() - startTime < maxWaitTime) {
      if (await this.isUuAppRunning()) {
        console.log("uuApp server is running");
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`uuApp server did not start within ${maxWaitTime}ms`);
  }

  /**
   * Checks if uuApp is running, and if not, starts it and waits for it to be ready.
   *
   * This method:
   * 1. Checks if the uuApp server is already running
   * 2. If not running, prepares the uuApp (updates config, runs package, uploadScript)
   * 3. Starts the server by running `npm start` in the server folder
   * 4. Waits for the server to be accessible before returning
   *
   * @returns {Promise<void>} Resolves when the uuApp is confirmed to be running
   * @throws {Error} If the server fails to start within the timeout period
   */
  async ensureUuAppRunning() {
    console.log("Checking if uuApp is running...");
    const isRunning = await this.isUuAppRunning();

    if (isRunning) {
      console.log("uuApp is already running");
      if (this.localConfig.hasUu5Lib) {
        const isLibRunning = await this.isUu5LibRunning();
        if (!isLibRunning) {
          console.log("uu5lib is not running, starting it...");
          await this.startUu5Lib();
          await this.waitForUu5LibRunning();
        } else {
          console.log("uu5lib is already running");
        }
      }
      return;
    }

    console.log("uuApp is not running, preparing and starting it...");
    await this.prepareUuAppBeforeStart();

    // Wait for uu5lib to be running
    if (this.localConfig.hasUu5Lib) {
      const isLibRunning = await this.isUu5LibRunning();
      if (!isLibRunning) {
        await this.startUu5Lib();
      } else {
        console.log("uu5lib is already running");
      }
    }
    if (this.localConfig.hasUu5Lib) {
      await this.waitForUu5LibRunning();
    }

    // start uuApp
    await this.startUuApp();
    await this.waitForUuAppRunning();
  }
}

async function main() {
  const start = new Start();
  await start.ensureUuAppRunning();
}

// Only run main if this file is executed directly
if (require.main === module) {
  main();
}

// Export the class and main function for use in other modules
module.exports = { Start, main };
