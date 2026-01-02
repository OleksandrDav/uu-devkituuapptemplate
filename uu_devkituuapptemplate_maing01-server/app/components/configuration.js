"use strict";
const { CacheManager } = require("uu_appg01_cache");
const { Config } = require("uu_appg01_server").Utils;
const { UriBuilder } = require("uu_appg01_server").Uri;
const { UseCaseContext } = require("uu_appg01_server").AppServer;
const { UuAppWorkspace } = require("uu_appg01_server").Workspace;
const { UuTerrClient } = require("uu_territory_clientg01");

const DevKitUuAppTemplateMainConstants = require("../constants/devkituuapptemplate-main-constants");
const DevKitUuAppTemplateMainUseCaseWarning = require("../api/warnings/devkituuapptemplate-main-use-case-warning");
const DtoBuilder = require("./dto-builder");
const ConfigError = require("../api/errors/config-error");

class Configuration {
  static relatedObjectMapCache = CacheManager.getCache(
    `${DevKitUuAppTemplateMainConstants.UUAPP_CODE}/${DevKitUuAppTemplateMainConstants.CONFIG_CACHE_KEY}`,
  );

  static async getUuSubAppConfiguration(uuDevKitUuAppTemplate) {
    return await this.relatedObjectMapCache.get(
      uuDevKitUuAppTemplate.awid,
      DevKitUuAppTemplateMainConstants.CONFIG_CACHE_KEY,
      async () => await this.buildConfiguration(uuDevKitUuAppTemplate),
    );
  }

  static async buildConfiguration(uuDevKitUuAppTemplate) {
    const mergeConfiguration = (currentConfig, updatedConfig, missingConfigPropertyList) => {
      const configProperties = [...missingConfigPropertyList];
      for (const configProperty of configProperties) {
        if (currentConfig[configProperty] === undefined && updatedConfig[configProperty] !== undefined) {
          currentConfig[configProperty] = updatedConfig[configProperty];
          missingConfigPropertyList.splice(missingConfigPropertyList.indexOf(configProperty), 1);
        }
      }
      return currentConfig;
    };

    let configuration = {};
    let missingConfigPropertyList = ["uuConsoleBaseUri", "uuScriptEngineBaseUri", "uuScriptRepositoryBaseUri"];
    let appClientOpts = {
      baseUri: uuDevKitUuAppTemplate.uuTerritoryBaseUri,
      session: UseCaseContext.getSession(),
      appUri: UseCaseContext.getUri(),
    };

    configuration = mergeConfiguration(configuration, uuDevKitUuAppTemplate, missingConfigPropertyList);

    // loads uuSubApp configuration
    if (missingConfigPropertyList.length > 0) {
      let uuAppWorkspace = await UuAppWorkspace.get(uuDevKitUuAppTemplate.awid);
      configuration = mergeConfiguration(configuration, uuAppWorkspace, missingConfigPropertyList);
    }

    // loads resources from contextProperty configuration
    let uuDevKitUuAppTemplateCtxProperty;
    let contextPropertyLoadDtoIn = {
      id: uuDevKitUuAppTemplate.artifactId,
      uuAppMetaModelCode: DevKitUuAppTemplateMainConstants.UUAPP_CODE,
      propertyCode: DevKitUuAppTemplateMainConstants.PropertyMap.DEVKITUUAPPTEMPLATE_CONFIG,
    };

    try {
      let contextPropertyLoadDtoOut = await UuTerrClient.ArtifactIfc.ContextProperty.load(
        contextPropertyLoadDtoIn,
        appClientOpts,
      );
      uuDevKitUuAppTemplateCtxProperty = contextPropertyLoadDtoOut.value;
    } catch (e) {
      DtoBuilder.addWarning(
        new DevKitUuAppTemplateMainUseCaseWarning("unableToReadConfigurationProperty", e.message, {
          code: contextPropertyLoadDtoIn.propertyCode,
          id: contextPropertyLoadDtoIn.id,
          baseUri: appClientOpts.baseUri,
          uuAppMetaModelCode: contextPropertyLoadDtoIn.uuAppMetaModelCode,
        }),
      );
    }

    if (uuDevKitUuAppTemplateCtxProperty && missingConfigPropertyList.length > 0) {
      let contextPropertyConfiguration = {
        uuConsoleBaseUri: this._getBaseUri(uuDevKitUuAppTemplateCtxProperty.uuConsoleUri),
        uuScriptEngineBaseUri: this._getBaseUri(uuDevKitUuAppTemplateCtxProperty.uuScriptEngineUri),
      };
      configuration = mergeConfiguration(configuration, contextPropertyConfiguration, missingConfigPropertyList);
    }

    // loads resources from uuBT Shared resources
    if (missingConfigPropertyList.length > 0) {
      let artifact;
      try {
        artifact = await UuTerrClient.ArtifactIfc.loadData(
          { id: uuDevKitUuAppTemplate.artifactId, getSharedResources: true },
          appClientOpts,
        );
      } catch (e) {
        DtoBuilder.addWarning(
          new DevKitUuAppTemplateMainUseCaseWarning("unableToLoadArtifactForConfiguration", e.message, {
            id: uuDevKitUuAppTemplate.artifactId,
            baseUri: appClientOpts.baseUri,
            getSharedResources: true,
          }),
        );
      }

      let sharedResourcesMap = artifact?.data?.sharedResourcesMap;
      if (sharedResourcesMap) {
        let sharedResourceConfiguration = {
          uuConsoleBaseUri: this._getBaseUri(
            sharedResourcesMap[DevKitUuAppTemplateMainConstants.SharedResources.SCRIPT_CONSOLE],
          ),
          uuScriptEngineBaseUri: this._getBaseUri(
            sharedResourcesMap[DevKitUuAppTemplateMainConstants.SharedResources.SCRIPT_ENGINE],
          ),
        };
        configuration = mergeConfiguration(configuration, sharedResourceConfiguration, missingConfigPropertyList);
      }
    }

    // loads resources from ASID configuration
    if (missingConfigPropertyList.length > 0) {
      let asidConfiguration = {
        uuConsoleBaseUri: Config.get("script_console_base_uri"),
        uuScriptEngineBaseUri: Config.get("script_engine_base_uri"),
        uuScriptRepositoryBaseUri: Config.get("script_repository_base_uri"),
      };
      configuration = mergeConfiguration(configuration, asidConfiguration, missingConfigPropertyList);
    }

    configuration.uuAppMetaModelVersion = UuAppWorkspace.getUuAppMetaModelVersion();

    if (missingConfigPropertyList.length > 0) {
      throw new ConfigError.ConfigurationLoadFailed({
        missingKeyList: missingConfigPropertyList,
      });
    } else if (!configuration.uuAppMetaModelVersion) {
      throw new ConfigError.UuAppMetaModelDoesNotExist();
    }

    configuration.uuConsoleCode = uuDevKitUuAppTemplateCtxProperty?.uuConsoleCode || Config.get("script_console_code");

    configuration.uuAppUuFlsBaseUri = uuDevKitUuAppTemplateCtxProperty?.uuFlsBaseUri || Config.get("fls_base_uri");
    configuration.uuAppUuSlsBaseUri = uuDevKitUuAppTemplateCtxProperty?.uuSlsBaseUri || Config.get("sls_base_uri");

    configuration.uuAppBusinessRequestsUri = Config.get("business_request_uri");
    configuration.uuAppBusinessModelUri = Config.get("business_model_uri");
    configuration.uuAppApplicationModelUri = Config.get("application_model_uri");
    configuration.uuAppUserGuideUri = Config.get("user_guide_uri");
    configuration.uuAppWebKitUri = Config.get("web_uri");
    configuration.uuAppProductPortalUri = Config.get("product_portal_uri");

    return configuration;
  }

  static _getBaseUri(uri) {
    if (!uri) {
      return undefined;
    } else {
      return UriBuilder.parse(uri).toUri().getBaseUri().toString();
    }
  }
}

module.exports = Configuration;
