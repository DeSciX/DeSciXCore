"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensTransfersByTransactionHashEVME401 = void 0;
var ListTokensTransfersByTransactionHashEVME401 = (function () {
    function ListTokensTransfersByTransactionHashEVME401() {
    }
    ListTokensTransfersByTransactionHashEVME401.getAttributeTypeMap = function () {
        return ListTokensTransfersByTransactionHashEVME401.attributeTypeMap;
    };
    ListTokensTransfersByTransactionHashEVME401.discriminator = undefined;
    ListTokensTransfersByTransactionHashEVME401.attributeTypeMap = [
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
    return ListTokensTransfersByTransactionHashEVME401;
}());
exports.ListTokensTransfersByTransactionHashEVME401 = ListTokensTransfersByTransactionHashEVME401;
//# sourceMappingURL=listTokensTransfersByTransactionHashEVME401.js.map