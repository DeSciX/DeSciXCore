"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateEthereumTransactionsE403 = void 0;
var SimulateEthereumTransactionsE403 = (function () {
    function SimulateEthereumTransactionsE403() {
    }
    SimulateEthereumTransactionsE403.getAttributeTypeMap = function () {
        return SimulateEthereumTransactionsE403.attributeTypeMap;
    };
    SimulateEthereumTransactionsE403.discriminator = undefined;
    SimulateEthereumTransactionsE403.attributeTypeMap = [
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
    return SimulateEthereumTransactionsE403;
}());
exports.SimulateEthereumTransactionsE403 = SimulateEthereumTransactionsE403;
//# sourceMappingURL=simulateEthereumTransactionsE403.js.map