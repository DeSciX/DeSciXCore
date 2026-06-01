"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactionsRITokenTransfersInnerTokenData = void 0;
var SimulateEthereumTransactionsRITokenTransfersInnerTokenData = (function () {
    function SimulateEthereumTransactionsRITokenTransfersInnerTokenData() {
    }
    SimulateEthereumTransactionsRITokenTransfersInnerTokenData.getAttributeTypeMap = function () {
        return SimulateEthereumTransactionsRITokenTransfersInnerTokenData.attributeTypeMap;
    };
    SimulateEthereumTransactionsRITokenTransfersInnerTokenData.discriminator = undefined;
    SimulateEthereumTransactionsRITokenTransfersInnerTokenData.attributeTypeMap = [
        {
            "name": "contractAddress",
            "baseName": "contractAddress",
            "type": "string"
        },
        {
            "name": "fungibleValues",
            "baseName": "fungibleValues",
            "type": "SimulateEthereumTransactionsRITokenTransfersInnerTokenDataFungibleValues"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "nonFungibleValues",
            "baseName": "nonFungibleValues",
            "type": "SimulateEthereumTransactionsRITokenTransfersInnerTokenDataNonFungibleValues"
        },
        {
            "name": "standard",
            "baseName": "standard",
            "type": "string"
        },
        {
            "name": "symbol",
            "baseName": "symbol",
            "type": "string"
        }
    ];
    return SimulateEthereumTransactionsRITokenTransfersInnerTokenData;
}());
exports.SimulateEthereumTransactionsRITokenTransfersInnerTokenData = SimulateEthereumTransactionsRITokenTransfersInnerTokenData;
//# sourceMappingURL=simulateEthereumTransactionsRITokenTransfersInnerTokenData.js.map