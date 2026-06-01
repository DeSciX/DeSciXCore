"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionDetailsByTransactionHashEVME403 = void 0;
var ListInternalTransactionDetailsByTransactionHashEVME403 = (function () {
    function ListInternalTransactionDetailsByTransactionHashEVME403() {
    }
    ListInternalTransactionDetailsByTransactionHashEVME403.getAttributeTypeMap = function () {
        return ListInternalTransactionDetailsByTransactionHashEVME403.attributeTypeMap;
    };
    ListInternalTransactionDetailsByTransactionHashEVME403.discriminator = undefined;
    ListInternalTransactionDetailsByTransactionHashEVME403.attributeTypeMap = [
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
    return ListInternalTransactionDetailsByTransactionHashEVME403;
}());
exports.ListInternalTransactionDetailsByTransactionHashEVME403 = ListInternalTransactionDetailsByTransactionHashEVME403;
//# sourceMappingURL=listInternalTransactionDetailsByTransactionHashEVME403.js.map