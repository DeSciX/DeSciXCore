"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashXRPE401 = void 0;
var ListTransactionsByBlockHashXRPE401 = (function () {
    function ListTransactionsByBlockHashXRPE401() {
    }
    ListTransactionsByBlockHashXRPE401.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashXRPE401.attributeTypeMap;
    };
    ListTransactionsByBlockHashXRPE401.discriminator = undefined;
    ListTransactionsByBlockHashXRPE401.attributeTypeMap = [
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
    return ListTransactionsByBlockHashXRPE401;
}());
exports.ListTransactionsByBlockHashXRPE401 = ListTransactionsByBlockHashXRPE401;
//# sourceMappingURL=listTransactionsByBlockHashXRPE401.js.map