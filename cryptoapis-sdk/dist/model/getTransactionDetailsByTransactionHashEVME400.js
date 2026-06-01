"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashEVME400 = void 0;
var GetTransactionDetailsByTransactionHashEVME400 = (function () {
    function GetTransactionDetailsByTransactionHashEVME400() {
    }
    GetTransactionDetailsByTransactionHashEVME400.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashEVME400.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashEVME400.discriminator = undefined;
    GetTransactionDetailsByTransactionHashEVME400.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashEVME400;
}());
exports.GetTransactionDetailsByTransactionHashEVME400 = GetTransactionDetailsByTransactionHashEVME400;
//# sourceMappingURL=getTransactionDetailsByTransactionHashEVME400.js.map