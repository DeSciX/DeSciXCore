"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOsE403 = void 0;
var ListTransactionsByBlockHashUTXOsE403 = (function () {
    function ListTransactionsByBlockHashUTXOsE403() {
    }
    ListTransactionsByBlockHashUTXOsE403.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOsE403.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOsE403.discriminator = undefined;
    ListTransactionsByBlockHashUTXOsE403.attributeTypeMap = [
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
    return ListTransactionsByBlockHashUTXOsE403;
}());
exports.ListTransactionsByBlockHashUTXOsE403 = ListTransactionsByBlockHashUTXOsE403;
//# sourceMappingURL=listTransactionsByBlockHashUTXOsE403.js.map