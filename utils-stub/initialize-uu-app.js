const AppClient = require("uu_appg01_server").AppClient;
const open = require("open");

const fs = require("node:fs");
const path = require("node:path");

const OidcClient = require("./oidc-client");
const {
  getDefaultHost,
  streamToString,
  dataToStream,
  buildUuAppType,
  buildUuAppPath,
  buildAsidUri,
  buildAwidUri,
  parseCommandLineArgs,
  isLocalEnv,
  loadConfig,
} = require("./helpers");

/**
 * Main class for initializing a uuApp application instance.
 * Handles authentication, configuration loading, ASID (Application SubApp Instance Data) setup,
 * and AWID (Application Workspace Instance Data) initialization.
 *
 * The initialization process includes:
 * - User authentication (dev and prod tokens)
 * - Loading configuration from artifacts
 * - Setting up ASID with OIDC client credentials
 * - Creating and initializing multiple AWIDs
 * - Registering routes in the local gateway
 */
class InitializeUuAppClient {
  /**
   * Creates a new InitializeUuAppClient instance.
   * Initializes the instance with local configuration.
   */
  constructor() {
    // read params from command line (only --key=value is supported)
    this.dtoIn = parseCommandLineArgs();

    this.isLocalEnv = isLocalEnv(this.dtoIn);

    this.localConfig = loadConfig(this.isLocalEnv, this.dtoIn["env"]);

    const rootPath = path.join(__dirname, "..");
    const appNameFull = this.buildUuAppPath();
    const serverPath = path.join(rootPath, `${appNameFull}-server`);
    this.environmentFilePath = path.join(
      serverPath,
      "env",
      this.isLocalEnv ? "development.json" : `${this.dtoIn["env"]}-development.json`,
    );
    this.environmentConfig = require(this.environmentFilePath);
  }

  /**
   * Returns true if local config contains an artifact source configuration (Document Store).
   *
   * When missing, the script falls back to loading config locally from `./config.js`.
   *
   * @returns {boolean}
   */
  hasArtifactSource() {
    return !!this.localConfig?.source;
  }

  /**
   * Builds the uuApp type string in the format: vendor-uuAppName-uuSubAppgeneration
   *
   * The format combines vendor, application name, sub-application name, and generation
   * into a single identifier used for routing and URI construction.
   * All components are normalized to lowercase.
   *
   * @returns {string} The formatted uuApp type string (e.g., "uu-yulia-maing01")
   */
  buildUuAppType() {
    return buildUuAppType(this.localConfig.uuApp);
  }

  buildUuAppPath() {
    return buildUuAppPath(this.localConfig.uuApp);
  }

  /**
   * Builds the full ASID (Application SubApp Instance Data) URI.
   *
   * Constructs the complete base URI for accessing the ASID instance,
   * using the local development server and the uuApp type.
   *
   * @param {string} asid - The ASID identifier
   * @returns {string} The complete ASID base URI (e.g., "http://localhost:9090/uu-yulia-maing01/12345678901234567890123456789012")
   */
  buildAsidUri(asid) {
    return buildAsidUri(this.localConfig.uuApp.host, this.buildUuAppType(), asid);
  }

  /**
   * Builds the full AWID (Application Workspace Instance Data) URI.
   *
   * Constructs the complete base URI for accessing an AWID instance,
   * using the local development server and the uuApp type.
   *
   * @param {string} awid - The AWID identifier
   * @returns {string} The complete AWID base URI (e.g., "http://localhost:9090/uu-yulia-maing01/98765432109876543210987654321098")
   */
  buildAwidUri(awid) {
    return buildAwidUri(this.localConfig.uuApp.host, this.buildUuAppType(), awid);
  }

  /**
   * Performs interactive user authentication and initializes all required AppClient instances.
   *
   * This method:
   * - Obtains development and production OIDC tokens via interactive login
   * - Creates AppClient instances for various services (Business Territory, Gateway, OIDC, Document Store)
   * - Sets up ASID (Application SubApp Instance Data) AppClient
   * - Creates AppClient instances for all AWIDs (Application Workspace Instance Data) from configuration
   *
   * All clients are configured with appropriate base URIs and authentication headers.
   *
   * @returns {Promise<void>} Resolves when all authentication and client setup is complete
   */
  async getUserAuthentication() {
    // Get development environment token via interactive OIDC login
    this.devToken = await OidcClient.interactiveLogin();
    this.bearerDevToken = `Bearer ${this.devToken}`;

    if (this.hasArtifactSource()) {
      // Get production environment token via interactive OIDC login
      // token needed to load config from artifact
      this.prodToken = await OidcClient.interactiveLogin("prod");
      this.bearerProdToken = `Bearer ${this.prodToken}`;
    }

    // Initialize Business Territory service client (dev environment)
    this.uuBusinessTerritoryClient = new AppClient({
      baseUri: this.localConfig.uuBusinessTerritoryBaseUri,
      headers: { Authorization: this.bearerDevToken },
    });

    if (this.isLocalEnv) {
      // Initialize Gateway service client for local routing (dev environment)
      this.uuGatewayBaseUri = `http://localhost:9090/uu-gateway-maing02/99999999999999999999999999999992`;
      this.uuGatewayAppClient = new AppClient({
        baseUri: this.uuGatewayBaseUri,
        headers: { Authorization: this.bearerDevToken },
      });
    }

    // Initialize OIDC service client for authentication operations (dev environment)
    this.uuOidcBaseUri = this.isLocalEnv
      ? this.environmentConfig.uu_app_oidc_providers_oidcg02_uri
      : this.environmentConfig.uuAppServerEnvironment.uu_app_oidc_providers_oidcg02_uri;
    this.uuOidcBaseUri = this.uuOidcBaseUri.replace("/oidc", "");
    this.uuOidcAppClient = new AppClient({
      baseUri: this.uuOidcBaseUri,
      headers: { Authorization: this.bearerDevToken },
    });

    // Initialize Document Store client for configuration artifacts (production environment)
    if (this.hasArtifactSource()) {
      this.documentBaseUri = this.localConfig.source.baseUri;
      this.documentAppClient = new AppClient({
        baseUri: this.documentBaseUri,
        headers: { Authorization: this.bearerProdToken },
      });
    }

    // Build ASID base URI from local configuration
    this.asidBaseUri = this.buildAsidUri(this.localConfig.asid);
    // Initialize ASID AppClient (dev environment)
    this.asidAppClient = new AppClient({
      baseUri: this.asidBaseUri,
      headers: { Authorization: this.bearerDevToken },
    });

    // Build base URIs for all AWIDs from configuration
    this.awidBaseUriList = this.localConfig.awidList.map((awid) => this.buildAwidUri(awid.awid));
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
   * Reads configuration data from a document artifact stored in the Document Store.
   *
   * The configuration contains ASID and AWID mappings, OIDC client secrets, and other
   * initialization parameters needed for the application setup.
   *
   * @returns {Promise<void>} Resolves when configuration is successfully loaded and parsed
   * @throws {Error} If the artifact cannot be retrieved or parsed
   */
  async readConfigFromArtifact() {
    if (!this.hasArtifactSource()) {
      // Fallback - local config file (useful for local dev / offline initialization).
      console.log("No localConfig.source present - loading config from ./config.js");
      // eslint-disable-next-line global-require
      this.configFromArtifact = require("./config.js");
      console.log("Config loaded from ./config.js");
      return;
    }

    // read from artifact, but how to get production devToken?
    console.log("Reading config from artifact");
    const dtoOut = await this.documentAppClient.cmdGet(`${this.localConfig.source.appType}/ebc/file/getDataByOid`, {
      oid: this.localConfig.source.oid,
      uuEbcData: { fileOid: this.localConfig.source.fileOid },
    });
    this.configFromArtifact = JSON.parse(await streamToString(dtoOut));
    console.log("Config read from artifact");
  }

  /**
   * Validates the loaded configuration from artifact.
   *
   * This method should check that all required configuration fields are present
   * and properly formatted before proceeding with initialization.
   *
   * @returns {void}
   * @todo Implement configuration validation logic
   */
  validateConfig() {
    // TODO
  }

  /**
   * Checks if the uuApp server is running by attempting to connect to the ASID endpoint.
   *
   * @param {number} timeout - Optional timeout in milliseconds (default: 2000)
   * @returns {Promise<boolean>} Resolves to true if the server is running, false otherwise
   */

  /**
   * Checks the current state of the ASID (Application SubApp Instance Data).
   *
   * If the ASID is already active, initialization is skipped.
   * Otherwise, proceeds with full ASID initialization.
   *
   * @returns {Promise<void>} Resolves when ASID check and potential initialization is complete
   */
  async checkAsid() {
    try {
      // Attempt to retrieve current ASID state
      this.asidData = await this.asidAppClient.cmdGet("sys/uuSubAppInstance/get", {});
    } catch (error) {
      console.error(`Error getting ASID data: ${error}`);
    }
    // If ASID is already active, skip initialization
    if (this.asidData && this.asidData.sysState === "active") {
      console.log("ASID is initialized, skipping initialization...");
    } else {
      // ASID not initialized or not active, proceed with initialization
      console.log("ASID is not initialized, starting initialization...");
      await this.initAsid();
    }
  }

  /**
   * Initializes the ASID (Application SubApp Instance Data) with all required setup steps.
   *
   * This method performs the following operations:
   * 1. Generates OIDC client secret for ASID if not already present
   * 2. Stores the client secret back to the configuration artifact
   * 3. Registers ASID route in the local gateway
   * 4. Initializes the ASID subapp instance (if not already initialized)
   * 5. Configures OIDC client for ASID
   * 6. Creates database schemas by commencing the subapp instance
   *
   * @returns {Promise<void>} Resolves when ASID initialization is complete
   * @throws {Error} If any initialization step fails
   */
  async initAsid() {
    // Step 1: Generate clientSecret for ASID if necessary
    console.log("Checking clientSecret for ASID");
    this.asidDataFromConfig = this.configFromArtifact.asidMap[this.localConfig.asid];
    if (this.asidDataFromConfig.initToken && !this.asidDataFromConfig.clientSecret) {
      // Creating new clientSecret for ASID using init token
      console.log("Creating new client secret for ASID");
      const createCredentialsDtoOut = await this.uuOidcAppClient.cmdPost("authOidcClient/createCredentials", {
        clientId: this.localConfig.asid,
        credentialsInitToken: this.asidDataFromConfig.initToken,
      });
      console.log(`ASID clientSecret ${createCredentialsDtoOut.clientSecret} created`);

      // Store the generated client secret in memory
      this.asidDataFromConfig.clientSecret = createCredentialsDtoOut.clientSecret;
      this.configFromArtifact.asidMap[this.localConfig.asid].clientSecret = createCredentialsDtoOut.clientSecret;

      // Store updated config locally (just for sure if storing to artifact fails)
      fs.writeFileSync(path.join(__dirname, "config.json"), JSON.stringify(this.configFromArtifact, null, 2));

      // Step 2: Store client secret back to configuration artifact
      if (this.hasArtifactSource()) {
        console.log("Storing client secret to config artifact");
        await this.documentAppClient.cmdPost(`${this.localConfig.source.appType}/ebc/file/updateDataByOid`, {
          oid: this.localConfig.source.oid,
          "uuEbcData.data": dataToStream(JSON.stringify(this.configFromArtifact), "config.json"),
          uuEbcData: { fileOid: this.localConfig.source.fileOid },
        });
        console.log("Client secret stored to config artifact.");
      } else {
        console.log("No localConfig.source present - skipping config artifact update (local config.json was written).");
      }
    } else {
      console.log("Client secret already generated, skipping generation...");
    }

    // Step 3: Register ASID route in local gateway for routing requests
    if (this.isLocalEnv) {
      console.log("Adding ASID to local gateway");
      await this.uuGatewayAppClient.cmdPost("route/store", {
        product: this.buildUuAppType(),
        tenant: this.localConfig.asid,
        nodeList: [
          {
            host: getDefaultHost(),
            port: this.localConfig.uuApp.innerPort,
            ssl: false,
          },
        ],
      });
      console.log("ASID added to local gateway");
    }

    // Step 4: Initialize ASID subapp instance if it doesn't exist
    if (!this.asidData) {
      console.log("Initializing ASID");
      this.asidData = await this.asidAppClient.cmdPost("sys/uuSubAppInstance/init", {
        authorizationStrategy: "uuIdentityList",
        permissionMap: {
          [this.localConfig.uuIdentity]: ["AsidAuthorities", "AsidWriters"],
        },
        sysState: "active",
      });
      console.log("ASID initialized");

      // Step 5: Initialize OIDC client for ASID authentication
      console.log("Initializing ASID OIDC client");
      await this.asidAppClient.cmdPost("oidc/initOidcClient", {
        awid: this.localConfig.asid,
        clientSecret: this.asidDataFromConfig.clientSecret,
      });
      console.log("ASID OIDC client initialized");

      // Step 6: Create database schemas by commencing the subapp instance
      console.log("Creating schemas");
      await this.asidAppClient.cmdPost("sys/uuSubAppInstance/commence", {});
      console.log("Schemas created");
    }
  }

  /**
   * Processes each AWID (Application Workspace Instance Data) from the configuration.
   *
   * For each AWID, this method:
   * 1. Registers the AWID route in the local gateway
   * 2. Generates OIDC client secret if not already present
   * 3. Stores the client secret back to the configuration artifact
   * 4. Checks the current state of the AWID
   * 5. Initializes the AWID if it's not already active
   * 6. Opens the AWID in the default browser
   *
   * @returns {Promise<void>} Resolves when all AWIDs have been processed
   */
  async checkEachAwid() {
    this.awidDataList = [];
    let index = 0;
    for (const awidData of this.localConfig.awidList) {
      console.log(`---------------------${awidData.awid}---------------------`);

      // Step 1: Register AWID route in local gateway
      if (this.isLocalEnv) {
        console.log(`Adding AWID ${awidData.awid} to local gateway`);
        await this.uuGatewayAppClient.cmdPost("route/store", {
          product: this.buildUuAppType(),
          tenant: awidData.awid,
          nodeList: [
            {
              host: getDefaultHost(),
              port: this.localConfig.uuApp.innerPort,
              ssl: false,
            },
          ],
        });
        console.log(`AWID ${awidData.awid} added to local gateway`);
      }

      // Step 2: Generate OIDC client secret for AWID if needed
      console.log(`Checking AWID: ${awidData.awid} clientSecret`);
      if (!this.configFromArtifact.asidMap[this.localConfig.asid].awidMap[awidData.awid].clientSecret) {
        console.log(`AWID: ${awidData.awid} clientSecret not found, creating new clientSecret`);

        // Get ASID token if not already obtained (needed for creating AWID credentials)
        if (!this.asidToken) {
          console.log("Getting ASID token");
          this.asidToken = await this.uuOidcAppClient.cmdPost("oidc/grantToken", {
            grant_type: "client_credentials",
            client_id: this.localConfig.asid,
            client_secret: this.configFromArtifact.asidMap[this.localConfig.asid].clientSecret,
            scope: "openid https://uuapp-dev.plus4u.net/uu-oidc-maing02/",
          });
          console.log("ASID token granted");

          // Create AppClient with ASID token for OIDC calls
          this.uuOidcAppAsidClient = new AppClient({
            baseUri: this.uuOidcBaseUri,
            headers: { Authorization: `Bearer ${this.asidToken.id_token}` },
          });
        }

        // Create OIDC credentials for the AWID
        const createCredentialsDtoOut = await this.uuOidcAppAsidClient.cmdPost("authOidcClient/createCredentials", {
          clientId: awidData.awid,
        });

        // Store the generated client secret in memory
        this.configFromArtifact.asidMap[this.localConfig.asid].awidMap[awidData.awid].clientSecret =
          createCredentialsDtoOut.clientSecret;
        console.log(`AWID: ${awidData.awid} clientSecret ${createCredentialsDtoOut.clientSecret} created`);

        // Store updated config locally (just for sure if storing to artifact fails)
        fs.writeFileSync(path.join(__dirname, "config.json"), JSON.stringify(this.configFromArtifact, null, 2));

        // Step 3: Store client secret back to configuration artifact
        if (this.hasArtifactSource()) {
          console.log("Storing client secret to config artifact");
          await this.documentAppClient.cmdPost(`${this.localConfig.source.appType}/ebc/file/updateDataByOid`, {
            oid: this.localConfig.source.oid,
            "uuEbcData.data": dataToStream(JSON.stringify(this.configFromArtifact), "config.json"),
            uuEbcData: { fileOid: this.localConfig.source.fileOid },
          });
          console.log(`AWID: ${awidData.awid} clientSecret created and stored to config artifact`);
        } else {
          console.log(
            `No localConfig.source present - skipping config artifact update (local config.json was written) for AWID: ${awidData.awid}.`,
          );
        }
      } else {
        console.log(`AWID: ${awidData.awid} clientSecret already exists, skipping creation...`);
      }

      // Step 4: Check current AWID state
      console.log(`Checking AWID: ${awidData.awid}`);
      try {
        this.awidDataList[index] = await this.awidAppClientList[index].cmdGet("sys/uuAppWorkspace/load", {});
        console.log(`AWID: ${awidData.awid} data loaded`);
      } catch (error) {
        this.awidDataList.push(null);
        console.error(`Error checking AWID: ${awidData.awid}: ${error}`);
      }

      // Step 5: Initialize AWID if not already active
      if (!this.awidDataList[index]?.data || this.awidDataList[index]?.data?.state !== "active") {
        await this.initAwid(awidData, index);
      } else {
        console.log(`AWID: ${awidData.awid} is already active, skipping creation...`);
      }

      // Step 6: Open AWID in browser with Automated Two-Stage Launch
      // Stage 1: The "Warm-up" load. This triggers OIDC to consume the ?code= and
      // allows the browser to cache/parse the heavy framework files.
      console.log(`Opening AWID: ${awidData.awid} in browser (Stage 1: Warm-up)`);
      open(this.awidBaseUriList[index]);

      // We wait for 4 seconds to let the OIDC handshake finish and tokens be stored.
      console.log(`Waiting 4s for OIDC stabilization and browser cache warming...`);
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Stage 2: The "SSR" load. Now that the URL is clean and the session is
      // ready in LocalStorage, SSR and Hydration will work perfectly.
      console.log(`Refreshing AWID: ${awidData.awid} (Stage 2: SSR Stabilization)`);
      open(this.awidBaseUriList[index]);

      index++;
    }
  }

  /**
   * Initializes a specific AWID (Application Workspace Instance Data) through its lifecycle states.
   *
   * This method performs the following operations in sequence:
   * 1. Creates the AWID workspace if it doesn't exist (state: created)
   * 2. Initializes OIDC client for the AWID
   * 3. Assigns the AWID to the configured uuIdentity with a license (state: assigned)
   * 4. Initializes the AWID with workspace data (state: active)
   *
   * The AWID progresses through states: created -> assigned -> active
   *
   * @param {Object} awidData - The AWID configuration object containing awid, locationId, name, desc
   * @param {number} index - The index of the AWID in the awidList array
   * @returns {Promise<void>} Resolves when AWID initialization is complete
   * @throws {Error} If any initialization step fails
   */
  async initAwid(awidData, index) {
    // Step 1: Create AWID workspace if it doesn't exist
    if (!this.awidDataList[index]?.sysData.awidData) {
      console.log(`Creating AWID: ${awidData.awid}`);
      await this.asidAppClient.cmdPost("sys/uuAppWorkspace/create", {
        awidList: [awidData.awid],
      });
      // Reload AWID data to get updated state
      // for some reason, this fails on authorization for some uuApps
      // this.awidDataList[index] = await this.awidAppClientList[index].cmdGet("sys/uuAppWorkspace/load", {});
    }
    console.log(`AWID: ${awidData.awid} created`);

    // Step 2: Initialize OIDC client for AWID authentication
    console.log("Initializing AWID OIDC client");
    await this.asidAppClient.cmdPost("oidc/initOidcClient", {
      awid: awidData.awid,
      clientSecret: this.configFromArtifact.asidMap[this.localConfig.asid].awidMap[awidData.awid].clientSecret,
    });
    console.log(`AWID ${awidData.awid} OIDC client initialized`);

    // Step 3: Assign AWID to uuIdentity with license (if in "created" state)
    if (!this.awidDataList[index]?.sysData || this.awidDataList[index]?.sysData.awidData.sysState === "created") {
      console.log(`Assigning AWID: ${awidData.awid}`);
      this.awidDataList[index] = await this.asidAppClient.cmdPost("sys/uuAppWorkspace/assign", {
        awid: awidData.awid,
        awidInitiatorList: [this.localConfig.uuIdentity],
        // TODO: license should be passed from localConfig
        license: {
          type: "xs",
          size: 10,
        },
      });
      // Reload AWID data to get updated state
      this.awidDataList[index] = await this.awidAppClientList[index].cmdGet("sys/uuAppWorkspace/load", {});
    }
    console.log(`AWID: ${awidData.awid} assigned`);

    // Step 4: Initialize AWID with workspace data (if in "assigned" state)
    if (this.awidDataList[index]?.sysData.awidData.sysState === "assigned" && awidData.locationId) {
      console.log(`Initializing AWID: ${awidData.awid}`);
      try {
        this.awidDataList[index] = await this.awidAppClientList[index].cmdPost("sys/uuAppWorkspace/init", {
          mode: "standard",
          force: true,
          data: { ...awidData, awid: undefined },
        });
        console.log(`AWID: ${awidData.awid} initialization started...`);
      } catch (error) {
        console.error(`Error initializing AWID: ${awidData.awid}: ${error}`);
      }
    }
  }
}

/**
 * Main entry point for the uuApp initialization script.
 *
 * Executes the complete initialization workflow:
 * 1. Authenticates user and sets up all AppClient instances
 * 2. Reads configuration from artifact storage
 * 3. Validates the loaded configuration
 * 4. Checks and initializes ASID if needed
 * 5. Processes and initializes all AWIDs from configuration
 *
 * @returns {Promise<void>} Resolves when initialization is complete
 */
async function main() {
  // 0. create new instance of initialization client
  const initializeUuApp = new InitializeUuAppClient();

  // 1. get user authentication (for dev and production environment), prepare AppClient instances to call uuCmds with
  await initializeUuApp.getUserAuthentication();

  // 2. read configuration from artifact storage
  await initializeUuApp.readConfigFromArtifact();

  // TODO 3. validate the loaded configuration (not implemented yet)
  initializeUuApp.validateConfig();

  // FIXME - move here installation of scripts, creation of package in server - user will start uuapp himself
  // if (initializeUuApp.isLocalEnv) {
  //   // Call start.js to ensure uuApp is running
  //   const { main: startMain } = require("./start.js");
  //   await startMain();
  // }

  await initializeUuApp.checkAsid();
  await initializeUuApp.checkEachAwid();
}

// Execute the main initialization process
main();
