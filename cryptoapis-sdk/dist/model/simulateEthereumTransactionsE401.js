"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactionsE401 = void 0;
var SimulateEthereumTransactionsE401 = (function () {
    function SimulateEthereumTransactionsE401() {
    }
    SimulateEthereumTransactionsE401.getAttributeTypeMap = function () {
        return SimulateEthereumTransactionsE401.attributeTypeMap;
    };
    SimulateEthereumTransactionsE401.discriminator = undefined;
    SimulateEthereumTransactionsE401.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return SimulateEthereumTransactionsE401;
}());
exports.SimulateEthereumTransactionsE401 = SimulateEthereumTransactionsE401;
//# sourceMappingURL=simulateEthereumTransactionsE401.js.map