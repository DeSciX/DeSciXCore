"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnspentTransactionOutputsByAddressUTXOsE400 = void 0;
var ListUnspentTransactionOutputsByAddressUTXOsE400 = (function () {
    function ListUnspentTransactionOutputsByAddressUTXOsE400() {
    }
    ListUnspentTransactionOutputsByAddressUTXOsE400.getAttributeTypeMap = function () {
        return ListUnspentTransactionOutputsByAddressUTXOsE400.attributeTypeMap;
    };
    ListUnspentTransactionOutputsByAddressUTXOsE400.discriminator = undefined;
    ListUnspentTransactionOutputsByAddressUTXOsE400.attributeTypeMap = [
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
    return ListUnspentTransactionOutputsByAddressUTXOsE400;
}());
exports.ListUnspentTransactionOutputsByAddressUTXOsE400 = ListUnspentTransactionOutputsByAddressUTXOsE400;
//# sourceMappingURL=listUnspentTransactionOutputsByAddressUTXOsE400.js.map