const Environments = {
    gateway: "http://localhost:9090",
    oidcUri: "https://uuapp-dev.plus4u.net/uu-oidc-maing02/eca71064ecce44b0a25ce940eb8f053d",
    prodOidcUri: "https://uuidentity.plus4u.net/uu-oidc-maing02/bb977a99f4cc4c37a2afce3fd599d0a7",
    mongoUri: "mongodb://localhost:27018/?directConnection=true",
    uuBt: {
        appKey: "uu-businessterritory-maing01",
        asid: "00000000000000000000000000000001",
        awid: "00000000000000000000000000000002",
        getBaseUri() {
            return `${Environments.gateway}/${Environments.uuBt.appKey}/${Environments.uuBt.awid}`;
        },
        getAsidBaseUri() {
            return `${Environments.gateway}/${Environments.uuBt.appKey}/${Environments.uuBt.asid}`;
        }
    },
    uuBem: {
        appKey: "uu-bem-maing01",
        asid: "0000024092334c719f5be2c0fc83727a",
        awid: "00000ae825644b798bb269c172862b2f",
        getBaseUri() {
            return `${Environments.gateway}/${Environments.uuBem.appKey}/${Environments.uuBem.awid}`;
        },
        getAsidBaseUri() {
            return `${Environments.gateway}/${Environments.uuBem.appKey}/${Environments.uuBem.asid}`;
        }
    },
    uuScriptEngine: {
        appKey: "uu-script-engineg02",
        asid: "11111111111111111111111111111111",
        awid: "11111111111111111111111111111112",
        getBaseUri() {
            return `${Environments.gateway}/${Environments.uuScriptEngine.appKey}/${Environments.uuScriptEngine.awid}`;
        },
        getAsidBaseUri() {
            return `${Environments.gateway}/${Environments.uuScriptEngine.appKey}/${Environments.uuScriptEngine.asid}`;
        }
    },
    uuConsole: {
        appKey: "uu-console-maing02",
        asid: "33333333333333333333333333333331",
        awid: "33333333333333333333333333333332",
        getBaseUri() {
            return `${Environments.gateway}/${Environments.uuConsole.appKey}/${Environments.uuConsole.awid}`;
        },
        getAsidBaseUri() {
            return `${Environments.gateway}/${Environments.uuConsole.appKey}/${Environments.uuConsole.asid}`;
        }
    },
    uuScriptRepository: {
        appKey: "uu-script-repositoryg02",
        asid: "44444444444444444444444444444441",
        awid: "44444444444444444444444444444442",
        getBaseUri() {
            return `${Environments.gateway}/${Environments.uuScriptRepository.appKey}/${Environments.uuScriptRepository.awid}`;
        },
        getAsidBaseUri() {
            return `${Environments.gateway}/${Environments.uuScriptRepository.appKey}/${Environments.uuScriptRepository.asid}`;
        }
    },
    uuEventBroker: {
        appKey: "uu-territory-eventbrokerg01",
        asid: "000001b12af94dc6b433aed68e5e8a13",
        awid: "000000fe16564162a6a4516b5eb6c8ca",
        getBaseUri() {
            return `${Environments.gateway}/${Environments.uuEventBroker.appKey}/${Environments.uuEventBroker.awid}`;
        },
        getAsidBaseUri() {
            return `${Environments.gateway}/${Environments.uuEventBroker.appKey}/${Environments.uuEventBroker.asid}`;
        }
    },
    uuAsyncJob: {
        appKey: "uu-asyncjobg01-main",
        asid: "22222222222222222222222222222221",
        awid: "22222222222222222222222222222222",
        getBaseUri() {
            return `${Environments.gateway}/${Environments.uuAsyncJob.appKey}/${Environments.uuAsyncJob.awid}`;
        },
        getAsidBaseUri() {
            return `${Environments.gateway}/${Environments.uuAsyncJob.appKey}/${Environments.uuAsyncJob.asid}`;
        }
    },
    uuMT: {
        appKey: "uu-myterritory-maing01",
        asid: "10000000000000000000000000000001",
        awid: "10000000000000000000000000000002",
        yourAwid: "10000000000000000000000000000003",
        getBaseUri() {
            return `${Environments.gateway}/${Environments.uuMT.appKey}/${Environments.uuMT.awid}`;
        },
        getAsidBaseUri() {
            return `${Environments.gateway}/${Environments.uuMT.appKey}/${Environments.uuMT.asid}`;
        }
    },
    uuDW: {
        appKey: "uu-myterritory-dwg01",
        asid: "20000000000000000000000000000001",
        awid: "20000000000000000000000000000002",
        yourAwid: "20000000000000000000000000000003",
        getBaseUri() {
            return `${Environments.gateway}/${Environments.uuDW.appKey}/${Environments.uuDW.awid}`;
        },
        getAsidBaseUri() {
            return `${Environments.gateway}/${Environments.uuDW.appKey}/${Environments.uuDW.asid}`;
        }
    },
    uuGateway: {
        appKey: "uu-gateway-maing02",
        asid: "99999999999999999999999999999991",
        awid: "99999999999999999999999999999992",
        getBaseUri() {
            return `${Environments.gateway}/${Environments.uuGateway.appKey}/${Environments.uuGateway.awid}`;
        },
        getAsidBaseUri() {
            return `${Environments.gateway}/${Environments.uuGateway.appKey}/${Environments.uuGateway.asid}`;
        }
    },
};

module.exports = Environments;
