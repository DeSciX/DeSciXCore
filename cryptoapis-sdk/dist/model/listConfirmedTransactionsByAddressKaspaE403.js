"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressKaspaE403 = void 0;
var ListConfirmedTransactionsByAddressKaspaE403 = (function () {
    function ListConfirmedTransactionsByAddressKaspaE403() {
    }
    ListConfirmedTransactionsByAddressKaspaE403.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressKaspaE403.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressKaspaE403.discriminator = undefined;
    ListConfirmedTransactionsByAddressKaspaE403.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressKaspaE403;
}());
exports.ListConfirmedTransactionsByAddressKaspaE403 = ListConfirmedTransactionsByAddressKaspaE403;
//# sourceMappingURL=listConfirmedTransactionsByAddressKaspaE403.js.map