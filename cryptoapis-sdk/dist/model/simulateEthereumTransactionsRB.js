"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactionsRB = void 0;
var SimulateEthereumTransactionsRB = (function () {
    function SimulateEthereumTransactionsRB() {
    }
    SimulateEthereumTransactionsRB.getAttributeTypeMap = function () {
        return SimulateEthereumTransactionsRB.attributeTypeMap;
    };
    SimulateEthereumTransactionsRB.discriminator = undefined;
    SimulateEthereumTransactionsRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "SimulateEthereumTransactionsRBData"
        }
    ];
    return SimulateEthereumTransactionsRB;
}());
exports.SimulateEthereumTransactionsRB = SimulateEthereumTransactionsRB;
//# sourceMappingURL=simulateEthereumTransactionsRB.js.map