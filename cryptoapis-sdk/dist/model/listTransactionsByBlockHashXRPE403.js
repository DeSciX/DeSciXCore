"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashXRPE403 = void 0;
var ListTransactionsByBlockHashXRPE403 = (function () {
    function ListTransactionsByBlockHashXRPE403() {
    }
    ListTransactionsByBlockHashXRPE403.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashXRPE403.attributeTypeMap;
    };
    ListTransactionsByBlockHashXRPE403.discriminator = undefined;
    ListTransactionsByBlockHashXRPE403.attributeTypeMap = [
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
    return ListTransactionsByBlockHashXRPE403;
}());
exports.ListTransactionsByBlockHashXRPE403 = ListTransactionsByBlockHashXRPE403;
//# sourceMappingURL=listTransactionsByBlockHashXRPE403.js.map