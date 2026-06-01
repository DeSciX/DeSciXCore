"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOsE400 = void 0;
var ListConfirmedTransactionsByAddressUTXOsE400 = (function () {
    function ListConfirmedTransactionsByAddressUTXOsE400() {
    }
    ListConfirmedTransactionsByAddressUTXOsE400.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOsE400.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOsE400.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOsE400.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressUTXOsE400;
}());
exports.ListConfirmedTransactionsByAddressUTXOsE400 = ListConfirmedTransactionsByAddressUTXOsE400;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOsE400.js.map