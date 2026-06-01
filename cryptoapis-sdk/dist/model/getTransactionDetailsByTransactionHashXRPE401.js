"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashXRPE401 = void 0;
var GetTransactionDetailsByTransactionHashXRPE401 = (function () {
    function GetTransactionDetailsByTransactionHashXRPE401() {
    }
    GetTransactionDetailsByTransactionHashXRPE401.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashXRPE401.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashXRPE401.discriminator = undefined;
    GetTransactionDetailsByTransactionHashXRPE401.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashXRPE401;
}());
exports.GetTransactionDetailsByTransactionHashXRPE401 = GetTransactionDetailsByTransactionHashXRPE401;
//# sourceMappingURL=getTransactionDetailsByTransactionHashXRPE401.js.map