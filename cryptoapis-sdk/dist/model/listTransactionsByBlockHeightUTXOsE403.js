"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOsE403 = void 0;
var ListTransactionsByBlockHeightUTXOsE403 = (function () {
    function ListTransactionsByBlockHeightUTXOsE403() {
    }
    ListTransactionsByBlockHeightUTXOsE403.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOsE403.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOsE403.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOsE403.attributeTypeMap = [
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
    return ListTransactionsByBlockHeightUTXOsE403;
}());
exports.ListTransactionsByBlockHeightUTXOsE403 = ListTransactionsByBlockHeightUTXOsE403;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOsE403.js.map