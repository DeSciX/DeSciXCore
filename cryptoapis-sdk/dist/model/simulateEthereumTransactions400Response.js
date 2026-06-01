"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactions400Response = void 0;
var SimulateEthereumTransactions400Response = (function () {
    function SimulateEthereumTransactions400Response() {
    }
    SimulateEthereumTransactions400Response.getAttributeTypeMap = function () {
        return SimulateEthereumTransactions400Response.attributeTypeMap;
    };
    SimulateEthereumTransactions400Response.discriminator = undefined;
    SimulateEthereumTransactions400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "SimulateEthereumTransactionsE400"
        }
    ];
    return SimulateEthereumTransactions400Response;
}());
exports.SimulateEthereumTransactions400Response = SimulateEthereumTransactions400Response;
//# sourceMappingURL=simulateEthereumTransactions400Response.js.map