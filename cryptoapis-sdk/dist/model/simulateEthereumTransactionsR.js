"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactionsR = void 0;
var SimulateEthereumTransactionsR = (function () {
    function SimulateEthereumTransactionsR() {
    }
    SimulateEthereumTransactionsR.getAttributeTypeMap = function () {
        return SimulateEthereumTransactionsR.attributeTypeMap;
    };
    SimulateEthereumTransactionsR.discriminator = undefined;
    SimulateEthereumTransactionsR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "SimulateEthereumTransactionsRData"
        }
    ];
    return SimulateEthereumTransactionsR;
}());
exports.SimulateEthereumTransactionsR = SimulateEthereumTransactionsR;
//# sourceMappingURL=simulateEthereumTransactionsR.js.map