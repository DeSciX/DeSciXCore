"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactionsRIInternalTransactionsInner = void 0;
var SimulateEthereumTransactionsRIInternalTransactionsInner = (function () {
    function SimulateEthereumTransactionsRIInternalTransactionsInner() {
    }
    SimulateEthereumTransactionsRIInternalTransactionsInner.getAttributeTypeMap = function () {
        return SimulateEthereumTransactionsRIInternalTransactionsInner.attributeTypeMap;
    };
    SimulateEthereumTransactionsRIInternalTransactionsInner.discriminator = undefined;
    SimulateEthereumTransactionsRIInternalTransactionsInner.attributeTypeMap = [
        {
            "name": "depth",
            "baseName": "depth",
            "type": "number"
        },
        {
            "name": "operationType",
            "baseName": "operationType",
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
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "SimulateEthereumTransactionsRIInternalTransactionsInnerValue"
        }
    ];
    return SimulateEthereumTransactionsRIInternalTransactionsInner;
}());
exports.SimulateEthereumTransactionsRIInternalTransactionsInner = SimulateEthereumTransactionsRIInternalTransactionsInner;
//# sourceMappingURL=simulateEthereumTransactionsRIInternalTransactionsInner.js.map