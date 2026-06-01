"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIS = exports.HttpError = void 0;
__exportStar(require("./aMLApi"), exports);
var aMLApi_1 = require("./aMLApi");
__exportStar(require("./addressAMLApi"), exports);
var addressAMLApi_1 = require("./addressAMLApi");
__exportStar(require("./addressHistoryApi"), exports);
var addressHistoryApi_1 = require("./addressHistoryApi");
__exportStar(require("./addressHistoryEVMApi"), exports);
var addressHistoryEVMApi_1 = require("./addressHistoryEVMApi");
__exportStar(require("./addressHistoryUTXOsApi"), exports);
var addressHistoryUTXOsApi_1 = require("./addressHistoryUTXOsApi");
__exportStar(require("./addressLatestEVMApi"), exports);
var addressLatestEVMApi_1 = require("./addressLatestEVMApi");
__exportStar(require("./addressLatestKaspaApi"), exports);
var addressLatestKaspaApi_1 = require("./addressLatestKaspaApi");
__exportStar(require("./addressLatestSolanaApi"), exports);
var addressLatestSolanaApi_1 = require("./addressLatestSolanaApi");
__exportStar(require("./addressLatestUTXOsApi"), exports);
var addressLatestUTXOsApi_1 = require("./addressLatestUTXOsApi");
__exportStar(require("./addressLatestXRPApi"), exports);
var addressLatestXRPApi_1 = require("./addressLatestXRPApi");
__exportStar(require("./assetsApi"), exports);
var assetsApi_1 = require("./assetsApi");
__exportStar(require("./blockchainFeesEVMApi"), exports);
var blockchainFeesEVMApi_1 = require("./blockchainFeesEVMApi");
__exportStar(require("./blockchainFeesKaspaApi"), exports);
var blockchainFeesKaspaApi_1 = require("./blockchainFeesKaspaApi");
__exportStar(require("./blockchainFeesTezosApi"), exports);
var blockchainFeesTezosApi_1 = require("./blockchainFeesTezosApi");
__exportStar(require("./blockchainFeesUTXOsApi"), exports);
var blockchainFeesUTXOsApi_1 = require("./blockchainFeesUTXOsApi");
__exportStar(require("./blockchainFeesXRPApi"), exports);
var blockchainFeesXRPApi_1 = require("./blockchainFeesXRPApi");
__exportStar(require("./blocksEVMApi"), exports);
var blocksEVMApi_1 = require("./blocksEVMApi");
__exportStar(require("./blocksUTXOsApi"), exports);
var blocksUTXOsApi_1 = require("./blocksUTXOsApi");
__exportStar(require("./blocksXRPApi"), exports);
var blocksXRPApi_1 = require("./blocksXRPApi");
__exportStar(require("./broadcastLocallySignTransactionsApi"), exports);
var broadcastLocallySignTransactionsApi_1 = require("./broadcastLocallySignTransactionsApi");
__exportStar(require("./contractsEVMApi"), exports);
var contractsEVMApi_1 = require("./contractsEVMApi");
__exportStar(require("./contractsSolanaApi"), exports);
var contractsSolanaApi_1 = require("./contractsSolanaApi");
__exportStar(require("./createSubscriptionsForApi"), exports);
var createSubscriptionsForApi_1 = require("./createSubscriptionsForApi");
__exportStar(require("./exchangeRatesApi"), exports);
var exchangeRatesApi_1 = require("./exchangeRatesApi");
__exportStar(require("./featuresApi"), exports);
var featuresApi_1 = require("./featuresApi");
__exportStar(require("./hDWalletApi"), exports);
var hDWalletApi_1 = require("./hDWalletApi");
__exportStar(require("./hDWalletDataEVMApi"), exports);
var hDWalletDataEVMApi_1 = require("./hDWalletDataEVMApi");
__exportStar(require("./hDWalletDataUTXOApi"), exports);
var hDWalletDataUTXOApi_1 = require("./hDWalletDataUTXOApi");
__exportStar(require("./hDWalletDataXRPApi"), exports);
var hDWalletDataXRPApi_1 = require("./hDWalletDataXRPApi");
__exportStar(require("./manageAddressesApi"), exports);
var manageAddressesApi_1 = require("./manageAddressesApi");
__exportStar(require("./manageHDWalletApi"), exports);
var manageHDWalletApi_1 = require("./manageHDWalletApi");
__exportStar(require("./manageSubscriptionsApi"), exports);
var manageSubscriptionsApi_1 = require("./manageSubscriptionsApi");
__exportStar(require("./metadataApi"), exports);
var metadataApi_1 = require("./metadataApi");
__exportStar(require("./prepareTransactionsEVMsApi"), exports);
var prepareTransactionsEVMsApi_1 = require("./prepareTransactionsEVMsApi");
__exportStar(require("./simulateTransactionsEVMApi"), exports);
var simulateTransactionsEVMApi_1 = require("./simulateTransactionsEVMApi");
__exportStar(require("./toolsApi"), exports);
var toolsApi_1 = require("./toolsApi");
__exportStar(require("./toolsEVMApi"), exports);
var toolsEVMApi_1 = require("./toolsEVMApi");
__exportStar(require("./toolsUTXOsApi"), exports);
var toolsUTXOsApi_1 = require("./toolsUTXOsApi");
__exportStar(require("./toolsXRPApi"), exports);
var toolsXRPApi_1 = require("./toolsXRPApi");
__exportStar(require("./transactionsDataEVMApi"), exports);
var transactionsDataEVMApi_1 = require("./transactionsDataEVMApi");
__exportStar(require("./transactionsDataKaspaApi"), exports);
var transactionsDataKaspaApi_1 = require("./transactionsDataKaspaApi");
__exportStar(require("./transactionsDataSolanaApi"), exports);
var transactionsDataSolanaApi_1 = require("./transactionsDataSolanaApi");
__exportStar(require("./transactionsDataUTXOsApi"), exports);
var transactionsDataUTXOsApi_1 = require("./transactionsDataUTXOsApi");
__exportStar(require("./transactionsDataXRPApi"), exports);
var transactionsDataXRPApi_1 = require("./transactionsDataXRPApi");
__exportStar(require("./utilsApi"), exports);
var utilsApi_1 = require("./utilsApi");
var HttpError = (function (_super) {
    __extends(HttpError, _super);
    function HttpError(response, body, statusCode) {
        var _this = _super.call(this, 'HTTP request failed') || this;
        _this.response = response;
        _this.body = body;
        _this.statusCode = statusCode;
        _this.name = 'HttpError';
        return _this;
    }
    return HttpError;
}(Error));
exports.HttpError = HttpError;
exports.APIS = [aMLApi_1.AMLApi, addressAMLApi_1.AddressAMLApi, addressHistoryApi_1.AddressHistoryApi, addressHistoryEVMApi_1.AddressHistoryEVMApi, addressHistoryUTXOsApi_1.AddressHistoryUTXOsApi, addressLatestEVMApi_1.AddressLatestEVMApi, addressLatestKaspaApi_1.AddressLatestKaspaApi, addressLatestSolanaApi_1.AddressLatestSolanaApi, addressLatestUTXOsApi_1.AddressLatestUTXOsApi, addressLatestXRPApi_1.AddressLatestXRPApi, assetsApi_1.AssetsApi, blockchainFeesEVMApi_1.BlockchainFeesEVMApi, blockchainFeesKaspaApi_1.BlockchainFeesKaspaApi, blockchainFeesTezosApi_1.BlockchainFeesTezosApi, blockchainFeesUTXOsApi_1.BlockchainFeesUTXOsApi, blockchainFeesXRPApi_1.BlockchainFeesXRPApi, blocksEVMApi_1.BlocksEVMApi, blocksUTXOsApi_1.BlocksUTXOsApi, blocksXRPApi_1.BlocksXRPApi, broadcastLocallySignTransactionsApi_1.BroadcastLocallySignTransactionsApi, contractsEVMApi_1.ContractsEVMApi, contractsSolanaApi_1.ContractsSolanaApi, createSubscriptionsForApi_1.CreateSubscriptionsForApi, exchangeRatesApi_1.ExchangeRatesApi, featuresApi_1.FeaturesApi, hDWalletApi_1.HDWalletApi, hDWalletDataEVMApi_1.HDWalletDataEVMApi, hDWalletDataUTXOApi_1.HDWalletDataUTXOApi, hDWalletDataXRPApi_1.HDWalletDataXRPApi, manageAddressesApi_1.ManageAddressesApi, manageHDWalletApi_1.ManageHDWalletApi, manageSubscriptionsApi_1.ManageSubscriptionsApi, metadataApi_1.MetadataApi, prepareTransactionsEVMsApi_1.PrepareTransactionsEVMsApi, simulateTransactionsEVMApi_1.SimulateTransactionsEVMApi, toolsApi_1.ToolsApi, toolsEVMApi_1.ToolsEVMApi, toolsUTXOsApi_1.ToolsUTXOsApi, toolsXRPApi_1.ToolsXRPApi, transactionsDataEVMApi_1.TransactionsDataEVMApi, transactionsDataKaspaApi_1.TransactionsDataKaspaApi, transactionsDataSolanaApi_1.TransactionsDataSolanaApi, transactionsDataUTXOsApi_1.TransactionsDataUTXOsApi, transactionsDataXRPApi_1.TransactionsDataXRPApi, utilsApi_1.UtilsApi];
//# sourceMappingURL=apis.js.map