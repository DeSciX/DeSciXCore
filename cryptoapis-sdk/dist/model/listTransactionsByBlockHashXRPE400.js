"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashXRPE400 = void 0;
var ListTransactionsByBlockHashXRPE400 = (function () {
    function ListTransactionsByBlockHashXRPE400() {
    }
    ListTransactionsByBlockHashXRPE400.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashXRPE400.attributeTypeMap;
    };
    ListTransactionsByBlockHashXRPE400.discriminator = undefined;
    ListTransactionsByBlockHashXRPE400.attributeTypeMap = [
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
    return ListTransactionsByBlockHashXRPE400;
}());
exports.ListTransactionsByBlockHashXRPE400 = ListTransactionsByBlockHashXRPE400;
//# sourceMappingURL=listTransactionsByBlockHashXRPE400.js.map