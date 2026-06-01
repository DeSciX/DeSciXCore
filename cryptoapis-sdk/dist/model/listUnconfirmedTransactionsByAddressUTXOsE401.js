"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOsE401 = void 0;
var ListUnconfirmedTransactionsByAddressUTXOsE401 = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOsE401() {
    }
    ListUnconfirmedTransactionsByAddressUTXOsE401.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOsE401.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOsE401.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOsE401.attributeTypeMap = [
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
    return ListUnconfirmedTransactionsByAddressUTXOsE401;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOsE401 = ListUnconfirmedTransactionsByAddressUTXOsE401;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOsE401.js.map