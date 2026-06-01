"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressTokensTransferEVMRITokenData = void 0;
var ListSyncedAddressTokensTransferEVMRITokenData = (function () {
    function ListSyncedAddressTokensTransferEVMRITokenData() {
    }
    ListSyncedAddressTokensTransferEVMRITokenData.getAttributeTypeMap = function () {
        return ListSyncedAddressTokensTransferEVMRITokenData.attributeTypeMap;
    };
    ListSyncedAddressTokensTransferEVMRITokenData.discriminator = undefined;
    ListSyncedAddressTokensTransferEVMRITokenData.attributeTypeMap = [
        {
            "name": "fungibleValues",
            "baseName": "fungibleValues",
            "type": "ListSyncedAddressTokensTransferEVMRITokenDataFungibleValues"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "nonFungibleValues",
            "baseName": "nonFungibleValues",
            "type": "ListSyncedAddressTokensTransferEVMRITokenDataNonFungibleValues"
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
            "name": "standard",
            "baseName": "standard",
            "type": "string"
        }
    ];
    return ListSyncedAddressTokensTransferEVMRITokenData;
}());
exports.ListSyncedAddressTokensTransferEVMRITokenData = ListSyncedAddressTokensTransferEVMRITokenData;
//# sourceMappingURL=listSyncedAddressTokensTransferEVMRITokenData.js.map