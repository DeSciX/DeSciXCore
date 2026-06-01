"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightXRPE400 = void 0;
var ListTransactionsByBlockHeightXRPE400 = (function () {
    function ListTransactionsByBlockHeightXRPE400() {
    }
    ListTransactionsByBlockHeightXRPE400.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightXRPE400.attributeTypeMap;
    };
    ListTransactionsByBlockHeightXRPE400.discriminator = undefined;
    ListTransactionsByBlockHeightXRPE400.attributeTypeMap = [
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
    return ListTransactionsByBlockHeightXRPE400;
}());
exports.ListTransactionsByBlockHeightXRPE400 = ListTransactionsByBlockHeightXRPE400;
//# sourceMappingURL=listTransactionsByBlockHeightXRPE400.js.map