"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionIdKaspaE403 = void 0;
var GetTransactionDetailsByTransactionIdKaspaE403 = (function () {
    function GetTransactionDetailsByTransactionIdKaspaE403() {
    }
    GetTransactionDetailsByTransactionIdKaspaE403.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionIdKaspaE403.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionIdKaspaE403.discriminator = undefined;
    GetTransactionDetailsByTransactionIdKaspaE403.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionIdKaspaE403;
}());
exports.GetTransactionDetailsByTransactionIdKaspaE403 = GetTransactionDetailsByTransactionIdKaspaE403;
//# sourceMappingURL=getTransactionDetailsByTransactionIdKaspaE403.js.map