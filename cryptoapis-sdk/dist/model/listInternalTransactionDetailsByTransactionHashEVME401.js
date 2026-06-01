"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionDetailsByTransactionHashEVME401 = void 0;
var ListInternalTransactionDetailsByTransactionHashEVME401 = (function () {
    function ListInternalTransactionDetailsByTransactionHashEVME401() {
    }
    ListInternalTransactionDetailsByTransactionHashEVME401.getAttributeTypeMap = function () {
        return ListInternalTransactionDetailsByTransactionHashEVME401.attributeTypeMap;
    };
    ListInternalTransactionDetailsByTransactionHashEVME401.discriminator = undefined;
    ListInternalTransactionDetailsByTransactionHashEVME401.attributeTypeMap = [
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
    return ListInternalTransactionDetailsByTransactionHashEVME401;
}());
exports.ListInternalTransactionDetailsByTransactionHashEVME401 = ListInternalTransactionDetailsByTransactionHashEVME401;
//# sourceMappingURL=listInternalTransactionDetailsByTransactionHashEVME401.js.map