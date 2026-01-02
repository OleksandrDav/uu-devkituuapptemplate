"use strict";

const http = require("http");
const url = require("url");
const open = require("open");
const { AppClient } = require("uu_appg01_core-appclient");
const Environments = require("./environments");

const OAUTH_CODE = "code";
const OIDC_WELL_KNOWN_DISCOVERY_PATH = ".well-known/openid-configuration";
const OAUTH_GRANT_TYPE = "grant_type";
const OAUTH_GRANT_TYPE_CODE = "authorization_code";
const OAUTH_SCOPE = "scope";
const OAUTH_SCOPE_OPENID = "openid";
const OAUTH_CLIENT_ID = "client_id";
const OAUTH_CLIENT_SECRET = "client_secret";
const OAUTH_REDIRECT_URI = "redirect_uri";
const OAUTH_RESPONSE_TYPE = "response_type";
const DEFAULT_CLIENT_ID = "urn:uu:unregistered";
const DEFAULT_CLIENT_SECRET =
  "2u1q5KU2Z0Bs5SErmYVwM053+zyKDxT7QLU2Q7Rr7nn5t5%Bt80px8mf3$s16FdK";
const DEFAULT_AUDIENCE = "https:// http://localhost";

const OIDC_CONFIGS = {
  dev: {
    baseUri: Environments.oidcUri,
    infoPage:
      "https://uuapp-dev.plus4u.net/uu-identitymanagement-maing01/58ceb15c275c4b31bfe0fc9768aa6a9c/showAuthorizationCode",
  },
  prod: {
    baseUri: Environments.prodOidcUri,
    infoPage:
      "https://uuidentity.plus4u.net/uu-identitymanagement-maing01/a9b105aff2744771be4daa8361954677/showAuthorizationCode",
  },
};

class OidcClient {
  static async interactiveLogin(oidcConfigKey = "dev") {
    let [code, serverPort] =
      await OidcClient.getAuthorizationCode(oidcConfigKey);
    let token = await OidcClient.grantAuthorizationCodeToken(
      code,
      serverPort,
      oidcConfigKey,
    );
    return token.id_token;
  }

  static async getAuthorizationCode(oidcConfigKey) {
    let metadata = await OidcClient.getMetadata(oidcConfigKey);
    return await new Promise((resolve, reject) => {
      // Start local server to handle auth callback
      let server = http.createServer((req, res) => {
        let query = url.parse(req.url, true).query;
        let code = query[OAUTH_CODE];
        let redirectUri = OIDC_CONFIGS[oidcConfigKey].infoPage;
        redirectUri += `?clientId=${DEFAULT_CLIENT_ID}`;
        if (code) {
          resolve([code, server.address().port]);
          res.writeHead(302, { Location: redirectUri });
        } else {
          let uuAppErrorMap = query["uuAppErrorMap"];
          reject(
            new Error(
              `No access token code returned from OIDC server: ${uuAppErrorMap}`,
            ),
          );
          redirectUri += `&uuAppErrorMap=${uuAppErrorMap}`;
          res.writeHead(302, { Location: redirectUri });
        }
        res.end(() => {
          // Close server after response is handled
          server.close();
        });
      });
      server.listen(0);
      // Open browser to initialize auth process
      let authzUri = metadata["authorization_endpoint"];
      authzUri += `?${OAUTH_CLIENT_ID}=${DEFAULT_CLIENT_ID}`;
      authzUri += `&${OAUTH_REDIRECT_URI}=http://localhost:${server.address().port}`;
      authzUri += `&${OAUTH_RESPONSE_TYPE}=${OAUTH_CODE}`;
      authzUri += `&${OAUTH_SCOPE}=${OAUTH_SCOPE_OPENID}${encodeURIComponent(" " + DEFAULT_AUDIENCE)}`;
      open(authzUri);
    });
  }

  static async getMetadata(oidcConfigKey) {
    let providerUri = this.getOidcUri(OIDC_CONFIGS[oidcConfigKey].baseUri);
    let discoveryUri = `${providerUri}/${OIDC_WELL_KNOWN_DISCOVERY_PATH}`;
    let result = await AppClient.get(discoveryUri);
    return result.data;
  }

  static async grantAuthorizationCodeToken(
    authorizationCode,
    serverPort,
    oidcConfigKey,
  ) {
    let params = {};
    params[OAUTH_GRANT_TYPE] = OAUTH_GRANT_TYPE_CODE;
    params[OAUTH_CODE] = authorizationCode;
    params[OAUTH_CLIENT_ID] = DEFAULT_CLIENT_ID;
    params[OAUTH_CLIENT_SECRET] = DEFAULT_CLIENT_SECRET;
    params[OAUTH_SCOPE] = `${OAUTH_SCOPE_OPENID} ${DEFAULT_AUDIENCE}`;
    params[OAUTH_REDIRECT_URI] = `http://localhost:${serverPort}`;
    return await OidcClient.grantToken(params, oidcConfigKey);
  }

  static async grantToken(params, oidcConfigKey) {
    let metadata = await OidcClient.getMetadata(oidcConfigKey);
    let grantTokenUri = metadata["token_endpoint"];

    let headers = {};
    headers["Content-Type"] = "application/json";
    headers["Accept"] = "application/json";

    let result;
    try {
      result = await AppClient.post(grantTokenUri, params, { headers });
    } catch (e) {
      throw new Error(`Authentication failed: ${e}`);
    }
    return result.data;
  }

  static getOidcUri(baseUri) {
    return `${baseUri.replace(/\/oidc$/, "")}/oidc`;
  }
}

module.exports = OidcClient;
