"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOsE400 = void 0;
var GetTransactionDetailsByTransactionHashUTXOsE400 = (function () {
    function GetTransactionDetailsByTransactionHashUTXOsE400() {
    }
    GetTransactionDetailsByTransactionHashUTXOsE400.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOsE400.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOsE400.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOsE400.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashUTXOsE400;
}());
exports.GetTransactionDetailsByTransactionHashUTXOsE400 = GetTransactionDetailsByTransactionHashUTXOsE400;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOsE400.js.map