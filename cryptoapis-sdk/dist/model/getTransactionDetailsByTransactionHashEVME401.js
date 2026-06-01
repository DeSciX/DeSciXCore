"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashEVME401 = void 0;
var GetTransactionDetailsByTransactionHashEVME401 = (function () {
    function GetTransactionDetailsByTransactionHashEVME401() {
    }
    GetTransactionDetailsByTransactionHashEVME401.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashEVME401.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashEVME401.discriminator = undefined;
    GetTransactionDetailsByTransactionHashEVME401.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashEVME401;
}());
exports.GetTransactionDetailsByTransactionHashEVME401 = GetTransactionDetailsByTransactionHashEVME401;
//# sourceMappingURL=getTransactionDetailsByTransactionHashEVME401.js.map