"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactions401Response = void 0;
var SimulateEthereumTransactions401Response = (function () {
    function SimulateEthereumTransactions401Response() {
    }
    SimulateEthereumTransactions401Response.getAttributeTypeMap = function () {
        return SimulateEthereumTransactions401Response.attributeTypeMap;
    };
    SimulateEthereumTransactions401Response.discriminator = undefined;
    SimulateEthereumTransactions401Response.attributeTypeMap = [
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
            "type": "SimulateEthereumTransactionsE401"
        }
    ];
    return SimulateEthereumTransactions401Response;
}());
exports.SimulateEthereumTransactions401Response = SimulateEthereumTransactions401Response;
//# sourceMappingURL=simulateEthereumTransactions401Response.js.map