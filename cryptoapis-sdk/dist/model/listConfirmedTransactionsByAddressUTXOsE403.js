"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOsE403 = void 0;
var ListConfirmedTransactionsByAddressUTXOsE403 = (function () {
    function ListConfirmedTransactionsByAddressUTXOsE403() {
    }
    ListConfirmedTransactionsByAddressUTXOsE403.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOsE403.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOsE403.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOsE403.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressUTXOsE403;
}());
exports.ListConfirmedTransactionsByAddressUTXOsE403 = ListConfirmedTransactionsByAddressUTXOsE403;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOsE403.js.map