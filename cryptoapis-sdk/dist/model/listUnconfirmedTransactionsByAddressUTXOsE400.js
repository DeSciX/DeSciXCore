"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOsE400 = void 0;
var ListUnconfirmedTransactionsByAddressUTXOsE400 = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOsE400() {
    }
    ListUnconfirmedTransactionsByAddressUTXOsE400.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOsE400.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOsE400.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOsE400.attributeTypeMap = [
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
    return ListUnconfirmedTransactionsByAddressUTXOsE400;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOsE400 = ListUnconfirmedTransactionsByAddressUTXOsE400;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOsE400.js.map