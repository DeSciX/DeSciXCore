"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnspentTransactionOutputsByAddressUTXOsE401 = void 0;
var ListUnspentTransactionOutputsByAddressUTXOsE401 = (function () {
    function ListUnspentTransactionOutputsByAddressUTXOsE401() {
    }
    ListUnspentTransactionOutputsByAddressUTXOsE401.getAttributeTypeMap = function () {
        return ListUnspentTransactionOutputsByAddressUTXOsE401.attributeTypeMap;
    };
    ListUnspentTransactionOutputsByAddressUTXOsE401.discriminator = undefined;
    ListUnspentTransactionOutputsByAddressUTXOsE401.attributeTypeMap = [
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
    return ListUnspentTransactionOutputsByAddressUTXOsE401;
}());
exports.ListUnspentTransactionOutputsByAddressUTXOsE401 = ListUnspentTransactionOutputsByAddressUTXOsE401;
//# sourceMappingURL=listUnspentTransactionOutputsByAddressUTXOsE401.js.map