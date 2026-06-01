"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensTransfersByTransactionHashEVME403 = void 0;
var ListTokensTransfersByTransactionHashEVME403 = (function () {
    function ListTokensTransfersByTransactionHashEVME403() {
    }
    ListTokensTransfersByTransactionHashEVME403.getAttributeTypeMap = function () {
        return ListTokensTransfersByTransactionHashEVME403.attributeTypeMap;
    };
    ListTokensTransfersByTransactionHashEVME403.discriminator = undefined;
    ListTokensTransfersByTransactionHashEVME403.attributeTypeMap = [
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
    return ListTokensTransfersByTransactionHashEVME403;
}());
exports.ListTokensTransfersByTransactionHashEVME403 = ListTokensTransfersByTransactionHashEVME403;
//# sourceMappingURL=listTokensTransfersByTransactionHashEVME403.js.map