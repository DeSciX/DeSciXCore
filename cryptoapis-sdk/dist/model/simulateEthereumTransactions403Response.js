"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactions403Response = void 0;
var SimulateEthereumTransactions403Response = (function () {
    function SimulateEthereumTransactions403Response() {
    }
    SimulateEthereumTransactions403Response.getAttributeTypeMap = function () {
        return SimulateEthereumTransactions403Response.attributeTypeMap;
    };
    SimulateEthereumTransactions403Response.discriminator = undefined;
    SimulateEthereumTransactions403Response.attributeTypeMap = [
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
            "type": "SimulateEthereumTransactionsE403"
        }
    ];
    return SimulateEthereumTransactions403Response;
}());
exports.SimulateEthereumTransactions403Response = SimulateEthereumTransactions403Response;
//# sourceMappingURL=simulateEthereumTransactions403Response.js.map