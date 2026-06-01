"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactionsRBDataItem = void 0;
var SimulateEthereumTransactionsRBDataItem = (function () {
    function SimulateEthereumTransactionsRBDataItem() {
    }
    SimulateEthereumTransactionsRBDataItem.getAttributeTypeMap = function () {
        return SimulateEthereumTransactionsRBDataItem.attributeTypeMap;
    };
    SimulateEthereumTransactionsRBDataItem.discriminator = undefined;
    SimulateEthereumTransactionsRBDataItem.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "gasLimit",
            "baseName": "gasLimit",
            "type": "number"
        },
        {
            "name": "gasPrice",
            "baseName": "gasPrice",
            "type": "string"
        },
        {
            "name": "inputData",
            "baseName": "inputData",
            "type": "string"
        },
        {
            "name": "maxFeePerGas",
            "baseName": "maxFeePerGas",
            "type": "string"
        },
        {
            "name": "maxPriorityFeePerGas",
            "baseName": "maxPriorityFeePerGas",
            "type": "string"
        },
        {
            "name": "recipient",
            "baseName": "recipient",
            "type": "string"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "string"
        }
    ];
    return SimulateEthereumTransactionsRBDataItem;
}());
exports.SimulateEthereumTransactionsRBDataItem = SimulateEthereumTransactionsRBDataItem;
//# sourceMappingURL=simulateEthereumTransactionsRBDataItem.js.map