"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOsE401 = void 0;
var ListTransactionsByBlockHeightUTXOsE401 = (function () {
    function ListTransactionsByBlockHeightUTXOsE401() {
    }
    ListTransactionsByBlockHeightUTXOsE401.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOsE401.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOsE401.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOsE401.attributeTypeMap = [
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
    return ListTransactionsByBlockHeightUTXOsE401;
}());
exports.ListTransactionsByBlockHeightUTXOsE401 = ListTransactionsByBlockHeightUTXOsE401;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOsE401.js.map