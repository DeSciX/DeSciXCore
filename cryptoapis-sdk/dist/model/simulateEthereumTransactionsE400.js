"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactionsE400 = void 0;
var SimulateEthereumTransactionsE400 = (function () {
    function SimulateEthereumTransactionsE400() {
    }
    SimulateEthereumTransactionsE400.getAttributeTypeMap = function () {
        return SimulateEthereumTransactionsE400.attributeTypeMap;
    };
    SimulateEthereumTransactionsE400.discriminator = undefined;
    SimulateEthereumTransactionsE400.attributeTypeMap = [
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
    return SimulateEthereumTransactionsE400;
}());
exports.SimulateEthereumTransactionsE400 = SimulateEthereumTransactionsE400;
//# sourceMappingURL=simulateEthereumTransactionsE400.js.map