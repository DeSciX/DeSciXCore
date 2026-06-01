"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOsE403 = void 0;
var ListUnconfirmedTransactionsByAddressUTXOsE403 = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOsE403() {
    }
    ListUnconfirmedTransactionsByAddressUTXOsE403.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOsE403.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOsE403.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOsE403.attributeTypeMap = [
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
    return ListUnconfirmedTransactionsByAddressUTXOsE403;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOsE403 = ListUnconfirmedTransactionsByAddressUTXOsE403;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOsE403.js.map