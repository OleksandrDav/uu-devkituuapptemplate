/**
 * CLI utility that copies this template uuApp into a new project folder.
 *
 * It:
 * - reads basic app-identification parameters (vendor, uuApp, uuSubApp, generation)
 *   from command-line arguments (e.g. --vendor=uu --uuApp=myApp --uuSubApp=main --generation=g01)
 *   or, if missing, interactively from stdin
 * - optionally reads uuAtc (lowerCamelCase business object name used in template replacements)
 * - builds a map of all relevant name variants used in this template
 * - creates a new project root folder with the target name
 * - recursively copies files & folders while replacing occurrences of the template
 *   identifiers in both paths and file contents
 *
 * Usage (from project root):
 *   node utils-stub/create-uu-app.js --vendor=acme --uuApp=myNewApp --uuSubApp=main --generation=g01 --uuAtc=myAtc
 */

const readline = require("node:readline");
const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { buildUuAppPath } = require("./helpers");
const { createStepLogger } = require("./logger");
const localConfig = require("./local-config.json");

const questionMap = {
  vendor: "vendor: ",
  uuApp: "uuApp: ",
  uuSubApp: "uuSubApp: ",
  generation: "generation: ",
  uuAtc: "uuAtc (optional, lowerCamelCase; empty = historizableObject): ",
};

class CreateUuApp {
  constructor({ log }) {
    this.dtoIn = {};
    this.log = log;
    this.localConfig = localConfig;
  }

  _getFolderSuffix(key, fallback) {
    return this.localConfig?.folderSuffixMap?.[key] || fallback;
  }

  _isSkippableEntryName(name) {
    return (
      name === ".git" ||
      name === ".idea" ||
      name === ".cursor" ||
      name === ".vscode" ||
      name === ".uudck" ||
      name === "package-lock.json" ||
      name === "node_modules"
    );
  }

  _countCopyFiles(folderPath) {
    let count = 0;
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const entry of entries) {
      if (this._isSkippableEntryName(entry.name)) continue;
      const entryPath = path.join(folderPath, entry.name);
      if (entry.isDirectory()) {
        count += this._countCopyFiles(entryPath);
      } else {
        if (entry.name.endsWith(".zip")) continue;
        count += 1;
      }
    }
    return count;
  }

  /**
   * Initializes dtoIn from CLI arguments and, if needed, from interactive input.
   *
   * Supported CLI syntax:
   *   --vendor=uu --uuApp=myApp --uuSubApp=main --generation=g01 [--uuAtc=myAtc]
   *
   * Missing keys are asked on stdin using readline.
   *
   * Resulting shape of dtoIn:
   *   {
   *     vendor: string,  // e.g. uu
   *     uuApp: string,  // e.g. myApp
   *     uuSubApp: string,  // e.g. main
   *     generation: string,  // e.g. "g01"
   *     uuAtc?: string  // optional, e.g. "myAtc" (empty / undefined => historizableObject)
   *   }
   */
  async getCreateParams() {
    // read params from command line (only --key=value is supported)
    for (let i = 2; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (!arg.startsWith("--")) {
        continue;
      }

      const rawKeyValue = arg.replace(/^--+/, "");
      const [key, rawValue] = rawKeyValue.split("=");
      if (key === "force") {
        this.dtoIn.force = rawValue === undefined ? true : rawValue.toLowerCase() !== "false";
      } else if (key === "uuAtc" && rawValue === undefined) {
        // allow `--uuAtc` to mean "ask me" (without forcing interactive when not used)
        this.dtoIn.uuAtc = null;
      } else if (rawValue !== undefined) {
        this.dtoIn[key] = rawValue;
      } else {
        this.dtoIn[key] = rawValue;
      }
    }

    // if some param is not provided, ask the user interactively
    let didPrompt = false;
    for (const key of ["vendor", "uuApp", "uuSubApp", "generation"]) {
      if (!this.dtoIn[key]) {
        didPrompt = true;
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const askQuestion = async function (q) {
          var response;

          rl.setPrompt(questionMap[q]);
          rl.prompt();

          return new Promise((resolve, reject) => {
            rl.on("line", (userInput) => {
              response = userInput;
              rl.close();
            });

            rl.on("close", () => {
              resolve(response);
            });
          });
        };
        this.dtoIn[key] = await askQuestion(key);
      }
    }

    // optional param - allow user to override historizableObject identifiers in template
    // - ask if user explicitly requested it via `--uuAtc` (without value)
    // - or if we're already in interactive mode due to missing mandatory params
    if (this.dtoIn.uuAtc === null || (didPrompt && this.dtoIn.uuAtc === undefined)) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const askOptionalQuestion = async function (q) {
        let response;

        rl.setPrompt(questionMap[q]);
        rl.prompt();

        return new Promise((resolve) => {
          rl.on("line", (userInput) => {
            response = userInput;
            rl.close();
          });

          rl.on("close", () => resolve(response));
        });
      };

      this.dtoIn.uuAtc = await askOptionalQuestion("uuAtc");
    }

    this.log.subStep(`Using input parameters: ${JSON.stringify(this.dtoIn)}`);

    return;
  }

  // FIXME - should validate dtoIn (all parts of dtoIn)
  //   validateUuAppName() {
  //     // check uuAppName is valid (lower camelCase - first letter is lowercase)
  //     if (/[a-z]{1}[A-Z]*[a-zA-Z]*/.exec(this.uuAppName)[0] !== this.uuAppName) {
  //       throw new Error(
  //         `Invalid uuApp name - ${this.uuAppName} - must be lowerCamelCase (e.g., 'myApp', 'helloWorld')`
  //       );
  //     }
  //     return;
  //   }

  /**
   * Prepares a map of string replacements for all known variants of the
   * template app name (folder names, PascalCase identifiers, DB names, etc.).
   *
   * Keys are literals as they appear in this template project.
   * Values are derived from dtoIn and used to:
   *   - rename folders / files (via path replacement)
   *   - replace occurrences in file contents
   */
  prepareStringMapToReplace() {
    // uuApp name is used in many forms - as names of folders, variables, files, etc.
    this.stringMapToReplace = {
      uu_devkituuapptemplate_maing01: `${this.dtoIn.vendor}_${this.dtoIn.uuApp.toLowerCase()}_${
        this.dtoIn.uuSubApp
      }${this.dtoIn.generation}`,
      "uu-devkituuapptemplate-maing01": `${this.dtoIn.vendor}-${this.dtoIn.uuApp.toLowerCase()}-${
        this.dtoIn.uuSubApp
      }${this.dtoIn.generation}`,
      "uu-devkituuapptemplate": `${this.dtoIn.vendor}-${this.dtoIn.uuApp.toLowerCase()}`,
      uu_devkituuapptemplateg01: `${this.dtoIn.vendor}_${this.dtoIn.uuApp.toLowerCase()}${this.dtoIn.generation}`,
      devkituuapptemplateg01: `${this.dtoIn.uuApp.toLowerCase()}${this.dtoIn.generation}`,
      "devkituuapptemplate-main": `${this.dtoIn.uuApp.toLowerCase()}-${this.dtoIn.uuSubApp.toLowerCase()}`,
      UuDevKitUuAppTemplateMaing01: `${this.dtoIn.vendor.replace(
        /[a-z]/,
        (input) => `${input.toUpperCase()}`,
      )}${this.dtoIn.uuApp.replace(/[a-z]/, (input) => `${input.toUpperCase()}`)}${this.dtoIn.uuSubApp.replace(
        /[a-z]/,
        (input) => `${input.toUpperCase()}`,
      )}${this.dtoIn.generation}`,
      uuDevKitUuAppTemplateMaing01: `${this.dtoIn.vendor}${this.dtoIn.uuApp.replace(
        /[a-z]/,
        (input) => `${input.toUpperCase()}`,
      )}${this.dtoIn.uuSubApp.replace(/[a-z]/, (input) => `${input.toUpperCase()}`)}${this.dtoIn.generation}`,
      uuDevKitUuAppTemplate: `${this.dtoIn.vendor}${this.dtoIn.uuApp.replace(
        /[a-z]/,
        (input) => `${input.toUpperCase()}`,
      )}`,
      UuDevKitUuAppTemplate: `${this.dtoIn.vendor.replace(
        /[a-z]/,
        (input) => `${input.toUpperCase()}`,
      )}${this.dtoIn.uuApp.replace(/[a-z]/, (input) => `${input.toUpperCase()}`)}`,
      devKitUuAppTemplateMain: `${this.dtoIn.uuApp}${this.dtoIn.uuSubApp.replace(
        /[a-z]/,
        (input) => `${input.toUpperCase()}`,
      )}`,
      DevKitUuAppTemplateMain: `${this.dtoIn.uuApp.replace(
        /[a-z]/,
        (input) => `${input.toUpperCase()}`,
      )}${this.dtoIn.uuSubApp.replace(/[a-z]/, (input) => `${input.toUpperCase()}`)}`,
      devKitUuAppTemplate: `${this.dtoIn.uuApp}`,
      DevKitUuAppTemplate: `${this.dtoIn.uuApp.replace(/[a-z]/, (input) => `${input.toUpperCase()}`)}`,
      "uu-dev-kit-uu-app-template-main": `${this.dtoIn.vendor}-${this.dtoIn.uuApp.replace(
        /[A-Z]/g,
        (input) => `-${input.toLowerCase()}`,
      )}-${this.dtoIn.uuSubApp.toLowerCase()}`,
      "dev-kit-uu-app-template-main": `${this.dtoIn.uuApp.replace(
        /[A-Z]/g,
        (input) => `-${input.toLowerCase()}`,
      )}-${this.dtoIn.uuSubApp.toLowerCase()}`,
      DEVKITUUAPPTEMPLATE: `${this.dtoIn.uuApp.toUpperCase()}`,
      historizableObject: `${this.dtoIn.uuAtc || "historizableObject"}`,
      HistorizableObject: `${this.dtoIn.uuAtc ? this.dtoIn.uuAtc.replace(/[a-z]/, (input) => `${input.toUpperCase()}`) : "HistorizableObject"}`,
      "historizable-object": `${
        this.dtoIn.uuAtc
          ? this.dtoIn.uuAtc.replace(/[A-Z]/g, (input) => `-${input.toLowerCase()}`)
          : "historizable-object"
      }`,
      HISTORIZABLE_OBJECT: `${
        this.dtoIn.uuAtc
          ? this.dtoIn.uuAtc.replace(/[A-Z]/g, (input) => `_${input.toUpperCase()}`).toUpperCase()
          : "HISTORIZABLE_OBJECT"
      }`,
    };
  }

  /**
   * Applies all configured string replacements on the given text.
   *
   * @param {string} stringToReplace - original string (path or file contents)
   * @returns {string} string with all template identifiers replaced
   */
  replaceStrings(stringToReplace) {
    // replace strings in file contents or paths
    Object.keys(this.stringMapToReplace).forEach((key) => {
      let re = new RegExp(String.raw`${key}`, "g");
      stringToReplace = stringToReplace.replace(re, this.stringMapToReplace[key]);
    });
    return stringToReplace;
  }

  /**
   * Determines source and target root folders and creates the target root.
   *
   * Source folder:
   *   - parent directory of this utils-stub folder (i.e., current template project root)
   *
   * Target folder:
   *   - obtained by applying string replacements on the source path
   */
  createRootFolder() {
    // create project folder to a new folder (sibling with replaced name)
    this.sourceFolder = path.dirname(__dirname, "..");
    this.targetFolder = this.replaceStrings(this.sourceFolder);
    const targetExists = fs.existsSync(this.targetFolder);
    if (targetExists) {
      if (this.dtoIn.force) {
        this.log.subStep("Target folder already exists - cleaning non-hidden entries before create.");
        this.cleanTargetFolder();
      } else {
        throw new Error(
          `Target folder ${this.targetFolder} already exists. Run the task with --force=trueto overwrite it.`,
        );
      }
    } else {
      fs.mkdirSync(this.targetFolder);
    }
    this.log.subStep(`Prepared root folder: ${this.targetFolder}`);
  }

  cleanTargetFolder() {
    const entries = fs.readdirSync(this.targetFolder, { withFileTypes: true });
    const entriesToDelete = entries.filter((entry) => !(entry.name.startsWith(".") && entry.isDirectory()));
    const total = entriesToDelete.length;
    if (total === 0) {
      this.log.subStep("Target folder is already clean (no non-hidden entries).");
      return;
    }

    this.log.subStep(`Cleaning target folder (non-hidden entries): ${total} item(s)...`);

    let i = 0;
    const stopSpinner = this.log.spinnerStart();
    try {
      entriesToDelete.forEach((entry) => {
        const isHiddenDirectory = entry.name.startsWith(".") && entry.isDirectory();
        if (isHiddenDirectory) {
          return;
        }
        i += 1;
        // spinner.update(`Cleaning target folder: ${i}/${total}`);
        const entryPath = path.join(this.targetFolder, entry.name);
        fs.rmSync(entryPath, { recursive: true, force: true });
      });
      this.log.subStep(`Target folder cleaned (${total} item(s) removed).`);
    } finally {
      stopSpinner();
      // spinner.stop(`Cleaning target folder: ${Math.min(i, total)}/${total} done`);
    }
  }

  /**
   * Recursively copies all files and folders starting at the given folderPath.
   *
   * For each entry:
   *   - some items are skipped entirely (.git, IDE config, node_modules, package-lock.json, *.zip)
   *   - directories are re-created under the target root with replaced names
   *   - file contents are read, processed via replaceStrings, and written
   *     into the corresponding replaced path
   *
   * @param {string} folderPath - current source folder to create from
   * @param {object} [ctx]
   * @param {{ update: Function }} [ctx.spinner]
   * @param {number} [ctx.totalFiles]
   * @param {{ copiedFiles: number }} [ctx.progress]
   */
  createFolderFiles(folderPath, ctx = {}) {
    const fileList = fs.readdirSync(folderPath);
    fileList.forEach((file) => {
      if (!this._isSkippableEntryName(file)) {
        const filePath = path.join(folderPath, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          const newFolderPath = this.replaceStrings(path.join(folderPath, file));
          fs.mkdirSync(newFolderPath);
          // Folder-by-folder creation is too noisy for terminal; keep it only in the log file.
          this.log.subStepFileOnly(`Creating folder: ${newFolderPath}`);
          this.createFolderFiles(filePath, ctx);
        } else {
          if (!file.endsWith(".zip")) {
            const targetFilePath = this.replaceStrings(path.join(folderPath, file));
            // File-by-file copying is too noisy for terminal; keep it only in the log file.
            this.log.subStepFileOnly(`Creating file: ${targetFilePath}`);
            const fileContent = fs.readFileSync(filePath, "utf8");
            const newFileContent = this.replaceStrings(fileContent);
            fs.writeFileSync(targetFilePath, newFileContent);

            if (ctx.spinner && ctx.totalFiles && ctx.progress) {
              ctx.progress.copiedFiles += 1;
              // ctx.spinner.update(`Copying files: ${ctx.progress.copiedFiles}/${ctx.totalFiles}`);
            }
          }
        }
      }
    });
  }

  /**
   * Installs npm dependencies in the target project's subfolders.
   *
   * Runs synchronously and outputs to the same terminal:
   * - npm install --legacy-peer-deps in the -hi folder
   * - npm install in -server, -uuscriptlib, and {appName}g{generation} folders
   */
  installDependencies() {
    const targetRoot = this.targetFolder;

    // Build folder names using the same pattern as the replacement map
    const appNameFull = buildUuAppPath({
      vendor: this.dtoIn.vendor,
      uuApp: this.dtoIn.uuApp,
      uuSubApp: this.dtoIn.uuSubApp,
      generation: this.dtoIn.generation,
    });
    const appNameShort = `${this.dtoIn.vendor}_${this.dtoIn.uuApp.toLowerCase()}${this.dtoIn.generation}`;
    const serverSuffix = this._getFolderSuffix("server", "server");
    const uuscriptlibSuffix = this._getFolderSuffix("uuscriptlib", "uuscriptlib");

    const folders = [
      { path: path.join(targetRoot, `utils-stub`), command: "npm install" },
      { path: path.join(targetRoot, `${appNameFull}-hi`), command: "npm install --legacy-peer-deps" },
      { path: path.join(targetRoot, `${appNameFull}-${serverSuffix}`), command: "npm install" },
      { path: path.join(targetRoot, `${appNameFull}-${uuscriptlibSuffix}`), command: "npm install" },
      { path: path.join(targetRoot, `${appNameShort}-uu5lib`), command: "npm install" },
    ];

    folders.forEach((folder) => {
      if (fs.existsSync(folder.path)) {
        this.log.subStep(`Installing dependencies in ${folder.path}...`);
        try {
          childProcess.execSync(folder.command, {
            cwd: folder.path,
            stdio: "inherit", // Output to the same terminal window
          });
          this.log.subStep(`Completed: ${folder.path}`);
        } catch (error) {
          this.log.error(`Failed to install dependencies in ${folder.path}`, error);
          throw error;
        }
      } else {
        this.log.warn(`Folder not found, skipping: ${folder.path}`);
      }
    });
  }

  /**
   * Creates server package in the generated *-server folder.
   *
   * Equivalent to running `npm run package` inside the server project.
   */
  createPackageInServer() {
    const appNameFull = buildUuAppPath({
      vendor: this.dtoIn.vendor,
      uuApp: this.dtoIn.uuApp,
      uuSubApp: this.dtoIn.uuSubApp,
      generation: this.dtoIn.generation,
    });

    const serverSuffix = this._getFolderSuffix("server", "server");
    const serverPath = path.join(this.targetFolder, `${appNameFull}-${serverSuffix}`);
    if (!fs.existsSync(serverPath)) {
      throw new Error(`Server folder not found: ${serverPath}`);
    }

    this.log.subStep(`Running "npm run package" in ${serverPath}...`);
    try {
      childProcess.execSync("npm run package", {
        cwd: serverPath,
        stdio: "inherit",
      });
      this.log.subStep(`Server package created: ${serverPath}`);
    } catch (error) {
      this.log.error(`Failed to run "npm run package" in ${serverPath}`, error);
      throw error;
    }
  }

  /**
   * Uploads uuScripts from the generated *-uuscriptlib folder.
   *
   * Equivalent to running `npm run uploadScript` inside the uuscriptlib project.
   */
  uploadScripts() {
    const appNameFull = buildUuAppPath({
      vendor: this.dtoIn.vendor,
      uuApp: this.dtoIn.uuApp,
      uuSubApp: this.dtoIn.uuSubApp,
      generation: this.dtoIn.generation,
    });

    const uuscriptlibSuffix = this._getFolderSuffix("uuscriptlib", "uuscriptlib");
    const uuscriptlibPath = path.join(this.targetFolder, `${appNameFull}-${uuscriptlibSuffix}`);
    if (!fs.existsSync(uuscriptlibPath)) {
      throw new Error(`uuscriptlib folder not found: ${uuscriptlibPath}`);
    }

    this.log.subStep(`Running "npm run uploadScript" in ${uuscriptlibPath}...`);
    try {
      childProcess.execSync("npm run uploadScript", {
        cwd: uuscriptlibPath,
        stdio: "inherit",
      });
      this.log.subStep(`Scripts uploaded: ${uuscriptlibPath}`);
    } catch (error) {
      this.log.error(`Failed to run "npm run uploadScript" in ${uuscriptlibPath}`, error);
      throw error;
    }
  }
}

// add help

async function main() {
  // TODO - add help and link to proper dokumentation
  // documentation - https://uuapp.plus4u.net/uu-bookkit-maing01/9aa68648f3814e3a9dd20ba69adcdab0/book/page?code=52500527

  // TODO - validate name of script, it should be more like createUuApp or something like that
  // TODO - we can probably have more templates for different types of uuApps (without uuBt, without uuBb, ...)
  const log = createStepLogger({ name: "create-uu-app" });
  log.step(`Starting create-uu-app (log file: ${log.logFilePath})`);

  let errorToThrow;
  let createUuApp;
  try {
    // 1. create new instance of createUuApp
    createUuApp = new CreateUuApp({ log });

    // 2. initialize the createUuApp instance
    // CONSIDER - Vladimír wants to be able to specify params in some json, but it is not usually done this way
    //          - usually we need to be able to run some script as simple as possible, with some mandatory params
    //          - similar to npx create-react-app, npx create-uu-app, ...
    //          - only vendor, uuApp, uuSubApp and generation are mandatory
    //          - npx create-uu-app will usually not be able to read some local JSON
    log.step("Reading input parameters");
    await createUuApp.getCreateParams();

    // 3. validate dtoIn
    // TODO - what to validate - rules for vendor, uuApp, uuSubApp, generation and uuAtc
    //          - vendor: should be lowerCase letters only
    //          - uuApp: should be a valid uuApp name (lower camelCase - first letter is lowercase)
    //          - uuSubApp: should be a valid uuSubApp name (lower camelCase - first letter is lowercase)
    //          - generation: should be a valid generation (g01, g02, ...)
    //          - uuAtc: should be a valid uuAtc name (lower camelCase - first letter is lowercase)

    // 4. prepare set of strings to replace with new uuApp
    log.step("Preparing replacement map");
    createUuApp.prepareStringMapToReplace();

    // 5. create new root folder and create files
    log.step("Creating target root folder");
    createUuApp.createRootFolder();

    // 6. create all folders and files, rename all folders and files and its contents
    log.step("Copying template files & folders");
    const totalFilesToCopy = createUuApp._countCopyFiles(createUuApp.sourceFolder);
    if (totalFilesToCopy > 0) {
      const copySpinner = log.spinnerStart();
      const copyProgress = { copiedFiles: 0 };
      try {
        createUuApp.createFolderFiles(createUuApp.sourceFolder, {
          spinner: copySpinner,
          totalFiles: totalFilesToCopy,
          progress: copyProgress,
        });
      } finally {
        copySpinner();
      }
    } else {
      log.subStep("No files to copy.");
    }

    // 7. install dependencies in all folders
    log.step("Installing dependencies");
    createUuApp.installDependencies();

    // 8. creation of package in server (for seamless installation of metamodel)
    log.step("Creating server package");
    createUuApp.createPackageInServer();

    // 9. upload scripts
    log.step("Uploading scripts");
    createUuApp.uploadScripts();

    // 10. open target folder in Cursor (if available)
    log.step("Opening target folder in Cursor");
    log.subStep("Finished creating uuApp. Opening folder in Cursor...");
    try {
      childProcess.execSync(`cursor ${createUuApp.targetFolder}`);
    } catch (error) {
      log.error("Failed to open folder in Cursor", error);
    }

    // 11. return proper dtoOut
    return createUuApp;
  } catch (e) {
    errorToThrow = e;
    log.error("create-uu-app failed", e);
    process.exitCode = 1;
  } finally {
    log.step("Finished");
    log.subStep(`Complete log is available at: ${log.logFilePath}`);
    await log.flush();
  }

  if (errorToThrow) throw errorToThrow;
}

main();
