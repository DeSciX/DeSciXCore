"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionIdKaspaE401 = void 0;
var GetTransactionDetailsByTransactionIdKaspaE401 = (function () {
    function GetTransactionDetailsByTransactionIdKaspaE401() {
    }
    GetTransactionDetailsByTransactionIdKaspaE401.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionIdKaspaE401.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionIdKaspaE401.discriminator = undefined;
    GetTransactionDetailsByTransactionIdKaspaE401.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionIdKaspaE401;
}());
exports.GetTransactionDetailsByTransactionIdKaspaE401 = GetTransactionDetailsByTransactionIdKaspaE401;
//# sourceMappingURL=getTransactionDetailsByTransactionIdKaspaE401.js.map