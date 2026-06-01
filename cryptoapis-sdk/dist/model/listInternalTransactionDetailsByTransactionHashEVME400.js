"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionDetailsByTransactionHashEVME400 = void 0;
var ListInternalTransactionDetailsByTransactionHashEVME400 = (function () {
    function ListInternalTransactionDetailsByTransactionHashEVME400() {
    }
    ListInternalTransactionDetailsByTransactionHashEVME400.getAttributeTypeMap = function () {
        return ListInternalTransactionDetailsByTransactionHashEVME400.attributeTypeMap;
    };
    ListInternalTransactionDetailsByTransactionHashEVME400.discriminator = undefined;
    ListInternalTransactionDetailsByTransactionHashEVME400.attributeTypeMap = [
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
    return ListInternalTransactionDetailsByTransactionHashEVME400;
}());
exports.ListInternalTransactionDetailsByTransactionHashEVME400 = ListInternalTransactionDetailsByTransactionHashEVME400;
//# sourceMappingURL=listInternalTransactionDetailsByTransactionHashEVME400.js.map