"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensTransfersByTransactionHashEVMRITokenData = void 0;
var ListTokensTransfersByTransactionHashEVMRITokenData = (function () {
    function ListTokensTransfersByTransactionHashEVMRITokenData() {
    }
    ListTokensTransfersByTransactionHashEVMRITokenData.getAttributeTypeMap = function () {
        return ListTokensTransfersByTransactionHashEVMRITokenData.attributeTypeMap;
    };
    ListTokensTransfersByTransactionHashEVMRITokenData.discriminator = undefined;
    ListTokensTransfersByTransactionHashEVMRITokenData.attributeTypeMap = [
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "nonFungibleValues",
            "baseName": "nonFungibleValues",
            "type": "ListTokensTransfersByTransactionHashEVMRITokenDataNonFungibleValues"
        },
        {
            "name": "symbol",
            "baseName": "symbol",
            "type": "string"
        },
        {
            "name": "contractAddress",
            "baseName": "contractAddress",
            "type": "string"
        },
        {
            "name": "fungibleValues",
            "baseName": "fungibleValues",
            "type": "ListTokensTransfersByTransactionHashEVMRITokenDataFungibleValues"
        },
        {
            "name": "standard",
            "baseName": "standard",
            "type": "string"
        }
    ];
    return ListTokensTransfersByTransactionHashEVMRITokenData;
}());
exports.ListTokensTransfersByTransactionHashEVMRITokenData = ListTokensTransfersByTransactionHashEVMRITokenData;
//# sourceMappingURL=listTokensTransfersByTransactionHashEVMRITokenData.js.map