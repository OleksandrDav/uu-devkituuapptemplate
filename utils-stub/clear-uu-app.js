const AppClient = require("uu_appg01_server").AppClient;

const OidcClient = require("./oidc-client");
const { Start } = require("./start.js");
const { buildUuAppType, buildAwidUri, parseCommandLineArgs, isLocalEnv, loadConfig } = require("./helpers");

/**
 * CLI utility that clears uuApp workspaces.
 *
 * It:
 * 1. Checks if uuApp is running, and starts it if not
 * 2. For each workspace (AWID) in the configuration:
 *    - Sets workspace to restricted state
 *    - Sets workspace to closed state (waits for completion)
 *    - Clears the workspace (waits for completion)
 *
 * Usage (from project root):
 *   node utils-stub/clear-uu-app.js [--env=environment]
 */
class ClearUuApp {
  /**
   * Creates a new ClearUuApp instance.
   * Initializes the instance with configuration based on environment.
   */
  constructor() {
    // read params from command line (only --key=value is supported)
    this.dtoIn = parseCommandLineArgs();

    this.isLocalEnv = isLocalEnv(this.dtoIn);

    this.localConfig = loadConfig(this.isLocalEnv, this.dtoIn["env"]);
    this.start = new Start(this.localConfig);
  }

  /**
   * Sets up authentication and initializes AppClient instances for all AWIDs.
   *
   * @returns {Promise<void>} Resolves when authentication and client setup is complete
   */
  async setupAuthentication() {
    // Get development environment token via interactive OIDC login
    this.devToken = await OidcClient.interactiveLogin();
    this.bearerDevToken = `Bearer ${this.devToken}`;

    // Build base URIs for all AWIDs from configuration
    this.awidBaseUriList = this.localConfig.awidList.map((awid) =>
      buildAwidUri(this.localConfig.uuApp.host, buildUuAppType(this.localConfig.uuApp), awid.awid),
    );

    // Initialize AppClient instances for all AWIDs (dev environment)
    this.awidAppClientList = this.awidBaseUriList.map(
      (awidBaseUri) =>
        new AppClient({
          baseUri: awidBaseUri,
          headers: { Authorization: this.bearerDevToken },
        }),
    );
  }

  /**
   * Waits for a workspace to reach a specific state by polling sys/uuAppWorkspace/load.
   *
   * @param {AppClient} awidAppClient - The AppClient for the AWID
   * @param {string} targetState - The target state to wait for (e.g., "closed")
   * @param {number} maxWaitTime - Maximum time to wait in milliseconds (default: 60000)
   * @param {number} pollInterval - Interval between checks in milliseconds (default: 1000)
   * @returns {Promise<void>} Resolves when the workspace reaches the target state
   * @throws {Error} If the workspace doesn't reach the target state within the maximum wait time
   */
  async waitForWorkspaceState(awidAppClient, targetState, maxWaitTime = 60000, pollInterval = 1000) {
    const startTime = Date.now();
    console.log(`Waiting for workspace to reach state: ${targetState}...`);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const workspaceData = await awidAppClient.cmdGet("sys/uuAppWorkspace/load", {});
        const currentSysState = workspaceData?.sysData?.awidData?.sysState;
        const currentState = workspaceData?.data?.state;
        if (!targetState) {
          if (currentSysState === "assigned") {
            console.log(`Workspace reached sysState: assigned`);
            return;
          }
          console.log(`Current workspace sysState: ${currentSysState}, waiting for: assigned...`);
        } else {
          if (currentState === targetState) {
            console.log(`Workspace reached state: ${targetState}`);
            return;
          }
          console.log(`Current workspace state: ${currentState}, waiting for: ${targetState}...`);
        }
      } catch (error) {
        throw new Error(`Error while waiting for workspace state: ${error.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Workspace did not reach state ${targetState} within ${maxWaitTime}ms`);
  }

  /**
   * Clears a single workspace by:
   * 1. Loading current workspace state
   * 2. If already cleared (load fails), skip everything
   * 3. Setting it to restricted state (if not already restricted)
   * 4. Setting it to closed state (if not already closed, waits for completion)
   * 5. Clearing it (waits for completion)
   *
   * @param {Object} awidData - The AWID configuration object
   * @param {number} index - The index of the AWID in the awidList array
   * @returns {Promise<void>} Resolves when the workspace is cleared
   */
  async clearWorkspace(awidData, index) {
    const awidAppClient = this.awidAppClientList[index];
    console.log(`\n---------------------${awidData.awid}---------------------`);

    // Step 0: Load current workspace state
    console.log(`Loading workspace ${awidData.awid} state...`);
    let workspaceData;
    try {
      workspaceData = await awidAppClient.cmdGet("sys/uuAppWorkspace/load", {});
      console.log(
        `Workspace ${awidData.awid} current state: ${workspaceData?.sysData?.awidData?.sysState || workspaceData?.state || "unknown"}`,
      );
    } catch (error) {
      // TODO - it can fail from different reasons, we need to handle it better
      // If load fails, workspace is already cleared
      console.log(`Workspace ${awidData.awid} is already cleared (load failed)`);
      return;
    }

    const currentSysState = workspaceData?.sysData?.awidData?.sysState;
    const currentState = workspaceData?.data?.state;

    console.log(`Current sys state: ${currentSysState}, current state: ${currentState}`);

    // Step 1: Set workspace to restricted state (if not already restricted)
    if (currentSysState === "assigned" || currentSysState === "restricted") {
      console.log(`Workspace ${awidData.awid} is already in restricted state, skipping...`);
    } else {
      console.log(`Setting workspace ${awidData.awid} to restricted state...`);
      try {
        await awidAppClient.cmdPost("sys/uuAppWorkspace/setRestrictedSysState", {});
        console.log(`Workspace ${awidData.awid} set to restricted state`);
      } catch (error) {
        console.error(`Error setting restricted state: ${error.message}`);
        throw error;
      }
    }

    // Step 2: Set workspace to closed state (if not already closed)
    if (currentSysState === "assigned" || currentState === "closed") {
      console.log(`Workspace ${awidData.awid} is already in closed state, skipping...`);
    } else {
      console.log(`Setting workspace ${awidData.awid} to closed state...`);
      try {
        await awidAppClient.cmdPost("sys/uuAppWorkspace/setStateClosed", { force: this.dtoIn.force === "true" });
        console.log(`Workspace ${awidData.awid} setStateClosed command initiated`);
      } catch (error) {
        console.error(`Error setting closed state: ${error.message}`);
        throw error;
      }

      // Wait for workspace to reach closed state
      await this.waitForWorkspaceState(awidAppClient, "closed");
      console.log(`Workspace ${awidData.awid} is now in closed state`);
    }

    // Step 3: Clear workspace (two-phase command)
    if (currentSysState === "assigned") {
      console.log(`Workspace ${awidData.awid} is already assigned, skipping...`);
    } else {
      console.log(`Clearing workspace ${awidData.awid}...`);
      try {
        await awidAppClient.cmdPost("sys/uuAppWorkspace/clear", {});
        console.log(`Workspace ${awidData.awid} clear command initiated`);
      } catch (error) {
        console.error(`Error clearing workspace: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Main method that orchestrates the clearing process for all workspaces.
   *
   * @returns {Promise<void>} Resolves when all workspaces are cleared
   */
  async clearAllWorkspaces() {
    // Check if uuApp is running, start if not (only for local environment)
    if (this.isLocalEnv) {
      console.log("Checking if uuApp is running...");
      const isRunning = await this.start.isUuAppRunning();

      if (!isRunning) {
        console.log("uuApp is not running, starting it...");
        await this.start.ensureUuAppRunning();
      } else {
        console.log("uuApp is already running");
      }
    }

    // Set up authentication and AppClient instances
    console.log("Setting up authentication...");
    await this.setupAuthentication();

    // Clear each workspace
    for (let index = 0; index < this.localConfig.awidList.length; index++) {
      const awidData = this.localConfig.awidList[index];
      await this.clearWorkspace(awidData, index);
    }

    console.log("\nAll workspaces cleared successfully");
  }
}

/**
 * Main entry point for the clear uuApp script.
 *
 * Executes the complete clearing workflow:
 * 1. Checks if uuApp is running, starts it if not
 * 2. Sets up authentication
 * 3. Clears all workspaces (AWIDs) from configuration
 *
 * @returns {Promise<void>} Resolves when clearing is complete
 */
async function main() {
  const clearUuApp = new ClearUuApp();
  await clearUuApp.clearAllWorkspaces();
}

// Execute the main clearing process
main().catch((error) => {
  console.error("Error clearing uuApp workspaces:", error);
  process.exit(1);
});
