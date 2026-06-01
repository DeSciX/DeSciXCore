"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnspentTransactionOutputsByAddressUTXOsE403 = void 0;
var ListUnspentTransactionOutputsByAddressUTXOsE403 = (function () {
    function ListUnspentTransactionOutputsByAddressUTXOsE403() {
    }
    ListUnspentTransactionOutputsByAddressUTXOsE403.getAttributeTypeMap = function () {
        return ListUnspentTransactionOutputsByAddressUTXOsE403.attributeTypeMap;
    };
    ListUnspentTransactionOutputsByAddressUTXOsE403.discriminator = undefined;
    ListUnspentTransactionOutputsByAddressUTXOsE403.attributeTypeMap = [
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
    return ListUnspentTransactionOutputsByAddressUTXOsE403;
}());
exports.ListUnspentTransactionOutputsByAddressUTXOsE403 = ListUnspentTransactionOutputsByAddressUTXOsE403;
//# sourceMappingURL=listUnspentTransactionOutputsByAddressUTXOsE403.js.map