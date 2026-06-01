"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashXRPE403 = void 0;
var GetTransactionDetailsByTransactionHashXRPE403 = (function () {
    function GetTransactionDetailsByTransactionHashXRPE403() {
    }
    GetTransactionDetailsByTransactionHashXRPE403.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashXRPE403.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashXRPE403.discriminator = undefined;
    GetTransactionDetailsByTransactionHashXRPE403.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashXRPE403;
}());
exports.GetTransactionDetailsByTransactionHashXRPE403 = GetTransactionDetailsByTransactionHashXRPE403;
//# sourceMappingURL=getTransactionDetailsByTransactionHashXRPE403.js.map