"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOsE400 = void 0;
var ListTransactionsByBlockHeightUTXOsE400 = (function () {
    function ListTransactionsByBlockHeightUTXOsE400() {
    }
    ListTransactionsByBlockHeightUTXOsE400.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOsE400.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOsE400.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOsE400.attributeTypeMap = [
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
    return ListTransactionsByBlockHeightUTXOsE400;
}());
exports.ListTransactionsByBlockHeightUTXOsE400 = ListTransactionsByBlockHeightUTXOsE400;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOsE400.js.map