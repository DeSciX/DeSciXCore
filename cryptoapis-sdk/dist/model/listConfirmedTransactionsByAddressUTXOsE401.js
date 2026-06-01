"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOsE401 = void 0;
var ListConfirmedTransactionsByAddressUTXOsE401 = (function () {
    function ListConfirmedTransactionsByAddressUTXOsE401() {
    }
    ListConfirmedTransactionsByAddressUTXOsE401.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOsE401.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOsE401.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOsE401.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressUTXOsE401;
}());
exports.ListConfirmedTransactionsByAddressUTXOsE401 = ListConfirmedTransactionsByAddressUTXOsE401;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOsE401.js.map