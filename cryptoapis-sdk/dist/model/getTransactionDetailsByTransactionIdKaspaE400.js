"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionIdKaspaE400 = void 0;
var GetTransactionDetailsByTransactionIdKaspaE400 = (function () {
    function GetTransactionDetailsByTransactionIdKaspaE400() {
    }
    GetTransactionDetailsByTransactionIdKaspaE400.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionIdKaspaE400.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionIdKaspaE400.discriminator = undefined;
    GetTransactionDetailsByTransactionIdKaspaE400.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionIdKaspaE400;
}());
exports.GetTransactionDetailsByTransactionIdKaspaE400 = GetTransactionDetailsByTransactionIdKaspaE400;
//# sourceMappingURL=getTransactionDetailsByTransactionIdKaspaE400.js.map