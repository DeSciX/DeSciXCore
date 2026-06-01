"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressKaspaE401 = void 0;
var ListConfirmedTransactionsByAddressKaspaE401 = (function () {
    function ListConfirmedTransactionsByAddressKaspaE401() {
    }
    ListConfirmedTransactionsByAddressKaspaE401.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressKaspaE401.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressKaspaE401.discriminator = undefined;
    ListConfirmedTransactionsByAddressKaspaE401.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressKaspaE401;
}());
exports.ListConfirmedTransactionsByAddressKaspaE401 = ListConfirmedTransactionsByAddressKaspaE401;
//# sourceMappingURL=listConfirmedTransactionsByAddressKaspaE401.js.map