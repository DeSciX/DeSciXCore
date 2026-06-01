"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightXRPE403 = void 0;
var ListTransactionsByBlockHeightXRPE403 = (function () {
    function ListTransactionsByBlockHeightXRPE403() {
    }
    ListTransactionsByBlockHeightXRPE403.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightXRPE403.attributeTypeMap;
    };
    ListTransactionsByBlockHeightXRPE403.discriminator = undefined;
    ListTransactionsByBlockHeightXRPE403.attributeTypeMap = [
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
    return ListTransactionsByBlockHeightXRPE403;
}());
exports.ListTransactionsByBlockHeightXRPE403 = ListTransactionsByBlockHeightXRPE403;
//# sourceMappingURL=listTransactionsByBlockHeightXRPE403.js.map