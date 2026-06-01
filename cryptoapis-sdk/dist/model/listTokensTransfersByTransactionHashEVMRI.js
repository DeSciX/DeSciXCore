"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensTransfersByTransactionHashEVMRI = void 0;
var ListTokensTransfersByTransactionHashEVMRI = (function () {
    function ListTokensTransfersByTransactionHashEVMRI() {
    }
    ListTokensTransfersByTransactionHashEVMRI.getAttributeTypeMap = function () {
        return ListTokensTransfersByTransactionHashEVMRI.attributeTypeMap;
    };
    ListTokensTransfersByTransactionHashEVMRI.discriminator = undefined;
    ListTokensTransfersByTransactionHashEVMRI.attributeTypeMap = [
        {
            "name": "recipient",
            "baseName": "recipient",
            "type": "string"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "string"
        },
        {
            "name": "tokenData",
            "baseName": "tokenData",
            "type": "ListTokensTransfersByTransactionHashEVMRITokenData"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListTokensTransfersByTransactionHashEVMRIFee"
        }
    ];
    return ListTokensTransfersByTransactionHashEVMRI;
}());
exports.ListTokensTransfersByTransactionHashEVMRI = ListTokensTransfersByTransactionHashEVMRI;
//# sourceMappingURL=listTokensTransfersByTransactionHashEVMRI.js.map