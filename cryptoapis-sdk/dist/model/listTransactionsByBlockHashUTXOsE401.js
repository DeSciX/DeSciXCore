"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOsE401 = void 0;
var ListTransactionsByBlockHashUTXOsE401 = (function () {
    function ListTransactionsByBlockHashUTXOsE401() {
    }
    ListTransactionsByBlockHashUTXOsE401.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOsE401.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOsE401.discriminator = undefined;
    ListTransactionsByBlockHashUTXOsE401.attributeTypeMap = [
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
    return ListTransactionsByBlockHashUTXOsE401;
}());
exports.ListTransactionsByBlockHashUTXOsE401 = ListTransactionsByBlockHashUTXOsE401;
//# sourceMappingURL=listTransactionsByBlockHashUTXOsE401.js.map