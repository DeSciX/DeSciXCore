"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactionsRI = void 0;
var SimulateEthereumTransactionsRI = (function () {
    function SimulateEthereumTransactionsRI() {
    }
    SimulateEthereumTransactionsRI.getAttributeTypeMap = function () {
        return SimulateEthereumTransactionsRI.attributeTypeMap;
    };
    SimulateEthereumTransactionsRI.discriminator = undefined;
    SimulateEthereumTransactionsRI.attributeTypeMap = [
        {
            "name": "contract",
            "baseName": "contract",
            "type": "string"
        },
        {
            "name": "gasLimit",
            "baseName": "gasLimit",
            "type": "number"
        },
        {
            "name": "gasUsed",
            "baseName": "gasUsed",
            "type": "number"
        },
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "inputData",
            "baseName": "inputData",
            "type": "string"
        },
        {
            "name": "internalTransactions",
            "baseName": "internalTransactions",
            "type": "Array<SimulateEthereumTransactionsRIInternalTransactionsInner>"
        },
        {
            "name": "nonce",
            "baseName": "nonce",
            "type": "number"
        },
        {
            "name": "positionInBlock",
            "baseName": "positionInBlock",
            "type": "number"
        },
        {
            "name": "status",
            "baseName": "status",
            "type": "string"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "tokenTransfers",
            "baseName": "tokenTransfers",
            "type": "Array<SimulateEthereumTransactionsRITokenTransfersInner>"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "SimulateEthereumTransactionsRIFee"
        },
        {
            "name": "gasPrice",
            "baseName": "gasPrice",
            "type": "SimulateEthereumTransactionsRIGasPrice"
        },
        {
            "name": "maxFeePerGas",
            "baseName": "maxFeePerGas",
            "type": "SimulateEthereumTransactionsRIMaxFeePerGas"
        },
        {
            "name": "maxPriorityFeePerGas",
            "baseName": "maxPriorityFeePerGas",
            "type": "SimulateEthereumTransactionsRIMaxPriorityFeePerGas"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "SimulateEthereumTransactionsRIMinedInBlock"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "SimulateEthereumTransactionsRIValue"
        }
    ];
    return SimulateEthereumTransactionsRI;
}());
exports.SimulateEthereumTransactionsRI = SimulateEthereumTransactionsRI;
//# sourceMappingURL=simulateEthereumTransactionsRI.js.map