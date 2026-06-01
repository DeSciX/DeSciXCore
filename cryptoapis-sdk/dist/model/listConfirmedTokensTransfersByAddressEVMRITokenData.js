"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTokensTransfersByAddressEVMRITokenData = void 0;
var ListConfirmedTokensTransfersByAddressEVMRITokenData = (function () {
    function ListConfirmedTokensTransfersByAddressEVMRITokenData() {
    }
    ListConfirmedTokensTransfersByAddressEVMRITokenData.getAttributeTypeMap = function () {
        return ListConfirmedTokensTransfersByAddressEVMRITokenData.attributeTypeMap;
    };
    ListConfirmedTokensTransfersByAddressEVMRITokenData.discriminator = undefined;
    ListConfirmedTokensTransfersByAddressEVMRITokenData.attributeTypeMap = [
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "nonFungibleValues",
            "baseName": "nonFungibleValues",
            "type": "ListConfirmedTokensTransfersByAddressEVMRITokenDataNonFungibleValues"
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
            "type": "ListConfirmedTokensTransfersByAddressEVMRITokenDataFungibleValues"
        },
        {
            "name": "standard",
            "baseName": "standard",
            "type": "string"
        }
    ];
    return ListConfirmedTokensTransfersByAddressEVMRITokenData;
}());
exports.ListConfirmedTokensTransfersByAddressEVMRITokenData = ListConfirmedTokensTransfersByAddressEVMRITokenData;
//# sourceMappingURL=listConfirmedTokensTransfersByAddressEVMRITokenData.js.map