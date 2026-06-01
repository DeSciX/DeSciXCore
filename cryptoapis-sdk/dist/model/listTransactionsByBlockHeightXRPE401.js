"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightXRPE401 = void 0;
var ListTransactionsByBlockHeightXRPE401 = (function () {
    function ListTransactionsByBlockHeightXRPE401() {
    }
    ListTransactionsByBlockHeightXRPE401.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightXRPE401.attributeTypeMap;
    };
    ListTransactionsByBlockHeightXRPE401.discriminator = undefined;
    ListTransactionsByBlockHeightXRPE401.attributeTypeMap = [
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
    return ListTransactionsByBlockHeightXRPE401;
}());
exports.ListTransactionsByBlockHeightXRPE401 = ListTransactionsByBlockHeightXRPE401;
//# sourceMappingURL=listTransactionsByBlockHeightXRPE401.js.map