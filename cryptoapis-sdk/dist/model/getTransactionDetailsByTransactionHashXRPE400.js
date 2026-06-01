"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashXRPE400 = void 0;
var GetTransactionDetailsByTransactionHashXRPE400 = (function () {
    function GetTransactionDetailsByTransactionHashXRPE400() {
    }
    GetTransactionDetailsByTransactionHashXRPE400.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashXRPE400.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashXRPE400.discriminator = undefined;
    GetTransactionDetailsByTransactionHashXRPE400.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashXRPE400;
}());
exports.GetTransactionDetailsByTransactionHashXRPE400 = GetTransactionDetailsByTransactionHashXRPE400;
//# sourceMappingURL=getTransactionDetailsByTransactionHashXRPE400.js.map