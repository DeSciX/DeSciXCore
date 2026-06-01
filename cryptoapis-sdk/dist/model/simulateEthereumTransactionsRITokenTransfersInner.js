"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactionsRITokenTransfersInner = void 0;
var SimulateEthereumTransactionsRITokenTransfersInner = (function () {
    function SimulateEthereumTransactionsRITokenTransfersInner() {
    }
    SimulateEthereumTransactionsRITokenTransfersInner.getAttributeTypeMap = function () {
        return SimulateEthereumTransactionsRITokenTransfersInner.attributeTypeMap;
    };
    SimulateEthereumTransactionsRITokenTransfersInner.discriminator = undefined;
    SimulateEthereumTransactionsRITokenTransfersInner.attributeTypeMap = [
        {
            "name": "recipient",
            "baseName": "recipient",
            "type": "string"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "string"
        },
        {
            "name": "tokenData",
            "baseName": "tokenData",
            "type": "SimulateEthereumTransactionsRITokenTransfersInnerTokenData"
        }
    ];
    return SimulateEthereumTransactionsRITokenTransfersInner;
}());
exports.SimulateEthereumTransactionsRITokenTransfersInner = SimulateEthereumTransactionsRITokenTransfersInner;
//# sourceMappingURL=simulateEthereumTransactionsRITokenTransfersInner.js.map