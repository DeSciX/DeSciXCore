"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashEVME403 = void 0;
var GetTransactionDetailsByTransactionHashEVME403 = (function () {
    function GetTransactionDetailsByTransactionHashEVME403() {
    }
    GetTransactionDetailsByTransactionHashEVME403.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashEVME403.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashEVME403.discriminator = undefined;
    GetTransactionDetailsByTransactionHashEVME403.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashEVME403;
}());
exports.GetTransactionDetailsByTransactionHashEVME403 = GetTransactionDetailsByTransactionHashEVME403;
//# sourceMappingURL=getTransactionDetailsByTransactionHashEVME403.js.map