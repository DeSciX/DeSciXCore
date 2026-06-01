"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOsE400 = void 0;
var ListTransactionsByBlockHashUTXOsE400 = (function () {
    function ListTransactionsByBlockHashUTXOsE400() {
    }
    ListTransactionsByBlockHashUTXOsE400.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOsE400.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOsE400.discriminator = undefined;
    ListTransactionsByBlockHashUTXOsE400.attributeTypeMap = [
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
    return ListTransactionsByBlockHashUTXOsE400;
}());
exports.ListTransactionsByBlockHashUTXOsE400 = ListTransactionsByBlockHashUTXOsE400;
//# sourceMappingURL=listTransactionsByBlockHashUTXOsE400.js.map