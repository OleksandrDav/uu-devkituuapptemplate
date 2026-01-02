const os = require("node:os");
const { Readable } = require("node:stream");

/**
 * Gets the default host address for Docker container communication.
 * On Windows, uses hostname.local format for WSL compatibility.
 * On macOS and Linux, uses the standard Docker host address.
 *
 * @returns {string} The host address to use for Docker container routing
 */
function getDefaultHost() {
  const platform = os.platform();
  if (platform === "win32") {
    // Only WSL needs to route to the host - address is hostname.local
    const hostname = os.hostname();
    return `${hostname}.local`;
  }
  // macOS and Linux
  return "host.docker.internal";
}

/**
 * Converts a readable stream to a string by collecting all chunks.
 * Resolves with the complete string when the stream ends.
 *
 * @param {ReadableStream} stream - The readable stream to convert
 * @returns {Promise<string>} A promise that resolves to the stream content as a UTF-8 string
 * @throws {Error} Rejects if the stream encounters an error
 */
async function streamToString(stream) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", (e) => reject(e));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

/**
 * Converts data (string or buffer) into a readable stream with an optional filename.
 * Useful for file upload operations that require stream format.
 *
 * @param {string|Buffer} data - The data to convert to a stream
 * @param {string} filename - Optional filename to attach to the stream
 * @returns {ReadableStream} A readable stream containing the data with filename property
 */
function dataToStream(data, filename) {
  let dataStream = new Readable();
  dataStream.push(data);
  dataStream.push(null);
  dataStream.filename = filename;
  return dataStream;
}

/**
 * Builds the uuApp type string in the format: vendor-uuAppName-uuSubAppgeneration
 *
 * The format combines vendor, application name, sub-application name, and generation
 * into a single identifier used for routing and URI construction.
 * All components are normalized to lowercase.
 *
 * @param {Object} uuAppConfig - The uuApp configuration object with vendor, uuApp, uuSubApp, and generation
 * @returns {string} The formatted uuApp type string (e.g., "uu-myapp-maing01")
 */
function buildUuAppType(uuAppConfig) {
  return `${uuAppConfig.vendor}-${uuAppConfig.uuApp.toLowerCase()}-${uuAppConfig.uuSubApp.toLowerCase()}${uuAppConfig.generation}`;
}

/**
 * Builds the uuApp path string in the format: vendor_uuAppName_uuSubAppgeneration
 *
 * The format combines vendor, application name, sub-application name, and generation
 * into a single identifier used for folder names and file paths.
 * All components are normalized to lowercase.
 *
 * @param {Object} uuAppConfig - The uuApp configuration object with vendor, uuApp, uuSubApp, and generation
 * @returns {string} The formatted uuApp path string (e.g., "uu_myapp_maing01")
 */
function buildUuAppPath(uuAppConfig) {
  return `${uuAppConfig.vendor}_${uuAppConfig.uuApp.toLowerCase()}_${uuAppConfig.uuSubApp.toLowerCase()}${uuAppConfig.generation}`;
}

/**
 * Builds the full ASID (Application SubApp Instance Data) URI.
 *
 * Constructs the complete base URI for accessing the ASID instance,
 * using the host and the uuApp type.
 *
 * @param {string} host - The host address (e.g., "http://localhost:9090")
 * @param {string} uuAppType - The uuApp type string (from buildUuAppType)
 * @param {string} asid - The ASID identifier
 * @returns {string} The complete ASID base URI (e.g., "http://localhost:9090/uu-myapp-maing01/12345678901234567890123456789012")
 */
function buildAsidUri(host, uuAppType, asid) {
  return `${host}/${uuAppType}/${asid}`;
}

/**
 * Builds the full AWID (Application Workspace Instance Data) URI.
 *
 * Constructs the complete base URI for accessing an AWID instance,
 * using the host and the uuApp type.
 *
 * @param {string} host - The host address (e.g., "http://localhost:9090")
 * @param {string} uuAppType - The uuApp type string (from buildUuAppType)
 * @param {string} awid - The AWID identifier
 * @returns {string} The complete AWID base URI (e.g., "http://localhost:9090/uu-myapp-maing01/98765432109876543210987654321098")
 */
function buildAwidUri(host, uuAppType, awid) {
  return `${host}/${uuAppType}/${awid}`;
}

/**
 * Parses command-line arguments in the format --key=value.
 * Only arguments starting with -- and containing = are processed.
 *
 * @returns {Object} An object with parsed key-value pairs
 */
function parseCommandLineArgs() {
  const dtoIn = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (!arg.startsWith("--") || !arg.includes("=")) {
      console.warn(`Skipping invalid argument: ${arg}`);
      continue;
    }
    const [keyPart, ...valueParts] = arg.replace("--", "").split("=");
    dtoIn[keyPart] = valueParts.join("=");
  }
  return dtoIn;
}

/**
 * Determines if the environment is local based on command-line arguments.
 *
 * @param {Object} dtoIn - Parsed command-line arguments
 * @returns {boolean} True if environment is local or not specified, false otherwise
 */
function isLocalEnv(dtoIn) {
  return !dtoIn["env"] || dtoIn["env"] === "local" || false;
}

/**
 * Loads configuration file based on environment.
 *
 * @param {boolean} isLocal - Whether the environment is local
 * @param {string} env - The environment name (if not local)
 * @returns {Object} The loaded configuration object
 */
function loadConfig(isLocal, env) {
  if (isLocal) {
    return require("./local-config.json");
  }
  return require(`./${env}-local-config.json`);
}

module.exports = {
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
};
