"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensTransfersByTransactionHashEVME400 = void 0;
var ListTokensTransfersByTransactionHashEVME400 = (function () {
    function ListTokensTransfersByTransactionHashEVME400() {
    }
    ListTokensTransfersByTransactionHashEVME400.getAttributeTypeMap = function () {
        return ListTokensTransfersByTransactionHashEVME400.attributeTypeMap;
    };
    ListTokensTransfersByTransactionHashEVME400.discriminator = undefined;
    ListTokensTransfersByTransactionHashEVME400.attributeTypeMap = [
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
    return ListTokensTransfersByTransactionHashEVME400;
}());
exports.ListTokensTransfersByTransactionHashEVME400 = ListTokensTransfersByTransactionHashEVME400;
//# sourceMappingURL=listTokensTransfersByTransactionHashEVME400.js.map