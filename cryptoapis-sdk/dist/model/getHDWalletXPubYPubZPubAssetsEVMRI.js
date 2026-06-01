"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHDWalletXPubYPubZPubAssetsEVMRI = void 0;
var GetHDWalletXPubYPubZPubAssetsEVMRI = (function () {
    function GetHDWalletXPubYPubZPubAssetsEVMRI() {
    }
    GetHDWalletXPubYPubZPubAssetsEVMRI.getAttributeTypeMap = function () {
        return GetHDWalletXPubYPubZPubAssetsEVMRI.attributeTypeMap;
    };
    GetHDWalletXPubYPubZPubAssetsEVMRI.discriminator = undefined;
    GetHDWalletXPubYPubZPubAssetsEVMRI.attributeTypeMap = [
        {
            "name": "confirmedBalance",
            "baseName": "confirmedBalance",
            "type": "string"
        },
        {
            "name": "fungibleTokens",
            "baseName": "fungibleTokens",
            "type": "Array<GetHDWalletXPubYPubZPubAssetsEVMRIFungibleTokensInner>"
        },
        {
            "name": "nonFungibleTokens",
            "baseName": "nonFungibleTokens",
            "type": "Array<GetHDWalletXPubYPubZPubAssetsEVMRINonFungibleTokensInner>"
        },
        {
            "name": "totalReceived",
            "baseName": "totalReceived",
            "type": "string"
        },
        {
            "name": "totalSpent",
            "baseName": "totalSpent",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return GetHDWalletXPubYPubZPubAssetsEVMRI;
}());
exports.GetHDWalletXPubYPubZPubAssetsEVMRI = GetHDWalletXPubYPubZPubAssetsEVMRI;
//# sourceMappingURL=getHDWalletXPubYPubZPubAssetsEVMRI.js.map