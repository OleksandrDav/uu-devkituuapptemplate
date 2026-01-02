"use strict";
const path = require("path");
const fs = require("fs-extra");
const os = require("os");

const { Config } = require("uu_appg01_server").Utils;
Config.set("uu_app_oidc_providers_oidcg02_verify_audience", false);

const { AuthenticationService } = require("uu_appg01_server").Authentication;
const PropertiesReader = require("properties-reader");

async function interactiveLogin(projectRoot = process.cwd(), force = false) {
  let tokenFile = path.resolve(projectRoot, "target", ".devkit-token");

  let session;
  if (!force && fs.existsSync(tokenFile)) {
    let properties = PropertiesReader(tokenFile);
    try {
      session = await AuthenticationService.authenticate(properties.get("id_token") || properties.get("idToken"));
    } catch (e) {
      // token invalid -> interactive login process will be started
    }
  }
  if (!session) {
    session = await AuthenticationService.authenticate();
    let idToken = await session.getCallToken(null, { useTokenExchange: false, excludeAuthenticationType: true });
    fs.outputFileSync(tokenFile, `id_token=${idToken}`);
  }
  return session;
}

async function systemIdentityLogin(systemIdentityFile, projectRoot = process.cwd(), force = false) {
  Config.set("uu_app_oidc_providers_oidcg02_client_credentials", systemIdentityFile);
  let tokenFile = path.resolve(projectRoot, "target", ".devkit-token");
  let session;
  if (!force && fs.existsSync(tokenFile)) {
    let properties = PropertiesReader(tokenFile);
    try {
      session = await AuthenticationService.authenticate(properties.get("id_token") || properties.get("idToken"));
    } catch (e) {
      // token invalid -> interactive login process will be started
    }
  }
  if (!session) {
    session = await AuthenticationService.authenticateSystemIdentity();
    let idToken = await session.getCallToken(null, { useTokenExchange: false, excludeAuthenticationType: true });
    fs.outputFileSync(tokenFile, `id_token=${idToken}`);
  }
  return session;
}

async function passwordFileLogin(pwFile) {
  const credentials = loadPasswordFile(pwFile);
  return await AuthenticationService.authenticate(credentials);
}

function loadPasswordFile(pwFile) {
  let pwFilePath = _resolvePath(pwFile.toString());
  if (!pwFilePath) {
    throw new Error("Invalid password file path: " + pwFile);
  }

  if (path.basename(pwFilePath).match(".json$")) {
    return _loadJsonPwFile(pwFilePath);
  } else {
    return _loadPropertiesPwFile(pwFilePath);
  }
}

function _loadPropertiesPwFile(pwFilePath) {
  const properties = PropertiesReader(pwFilePath);
  if (properties.get("idToken") || properties.get("id_token")) {
    return properties.get("idToken") || properties.get("id_token");
  } else {
    let accessCode1 = properties.get("username") || properties.get("accessCode1") || properties.get("access_code1");
    let accessCode2 = properties.get("password") || properties.get("accessCode2") || properties.get("access_code2");

    if (!accessCode1 || !accessCode2) {
      throw new Error("Invalid password file. It has to contain either idToken or both accessCode1 and accessCode2. Path: " + pwFilePath);
    }

    return { accessCode1, accessCode2 };
  }
}

function _loadJsonPwFile(pwFilePath) {
  const json = fs.readJsonSync(pwFilePath);
  if (json.idToken) {
    return json.idToken;
  } else {
    let accessCode1 = json.username || json.accessCode1 || json.access_code1;
    let accessCode2 = json.password || json.accessCode2 || json.access_code2;

    if (!accessCode1 || !accessCode2) {
      throw new Error("Invalid password file. It has to contain either idToken or both accessCode1 and accessCode2. Path: " + pwFilePath);
    }

    return { accessCode1, accessCode2 };
  }
}

function _resolvePath(pwFile) {
  // project dir
  let projectDir = path.resolve(process.cwd(), pwFile);
  if (fs.existsSync(projectDir)) {
    return projectDir;
  }

  // absolute path
  if (fs.existsSync(pwFile)) {
    return pwFile;
  }

  // home dir
  let homeDirPath = path.resolve(os.homedir(), pwFile);
  if (fs.existsSync(homeDirPath)) {
    return homeDirPath;
  }

  // TODO another path like uuhome?
  return null;
}

module.exports = { interactiveLogin, systemIdentityLogin, passwordFileLogin, loadPasswordFile };
