"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOsE401 = void 0;
var GetTransactionDetailsByTransactionHashUTXOsE401 = (function () {
    function GetTransactionDetailsByTransactionHashUTXOsE401() {
    }
    GetTransactionDetailsByTransactionHashUTXOsE401.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOsE401.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOsE401.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOsE401.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashUTXOsE401;
}());
exports.GetTransactionDetailsByTransactionHashUTXOsE401 = GetTransactionDetailsByTransactionHashUTXOsE401;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOsE401.js.map