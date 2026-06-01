"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressKaspaE400 = void 0;
var ListConfirmedTransactionsByAddressKaspaE400 = (function () {
    function ListConfirmedTransactionsByAddressKaspaE400() {
    }
    ListConfirmedTransactionsByAddressKaspaE400.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressKaspaE400.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressKaspaE400.discriminator = undefined;
    ListConfirmedTransactionsByAddressKaspaE400.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressKaspaE400;
}());
exports.ListConfirmedTransactionsByAddressKaspaE400 = ListConfirmedTransactionsByAddressKaspaE400;
//# sourceMappingURL=listConfirmedTransactionsByAddressKaspaE400.js.map