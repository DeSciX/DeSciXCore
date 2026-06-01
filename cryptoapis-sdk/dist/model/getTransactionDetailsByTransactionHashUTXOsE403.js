"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOsE403 = void 0;
var GetTransactionDetailsByTransactionHashUTXOsE403 = (function () {
    function GetTransactionDetailsByTransactionHashUTXOsE403() {
    }
    GetTransactionDetailsByTransactionHashUTXOsE403.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOsE403.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOsE403.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOsE403.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashUTXOsE403;
}());
exports.GetTransactionDetailsByTransactionHashUTXOsE403 = GetTransactionDetailsByTransactionHashUTXOsE403;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOsE403.js.map