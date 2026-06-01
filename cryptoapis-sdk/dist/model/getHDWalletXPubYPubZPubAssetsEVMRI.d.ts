import { GetHDWalletXPubYPubZPubAssetsEVMRIFungibleTokensInner } from './getHDWalletXPubYPubZPubAssetsEVMRIFungibleTokensInner';
import { GetHDWalletXPubYPubZPubAssetsEVMRINonFungibleTokensInner } from './getHDWalletXPubYPubZPubAssetsEVMRINonFungibleTokensInner';
export declare class GetHDWalletXPubYPubZPubAssetsEVMRI {
    'confirmedBalance': string;
    'fungibleTokens': Array<GetHDWalletXPubYPubZPubAssetsEVMRIFungibleTokensInner>;
    'nonFungibleTokens': Array<GetHDWalletXPubYPubZPubAssetsEVMRINonFungibleTokensInner>;
    'totalReceived': string;
    'totalSpent': string;
    'unit': string;
    static discriminator: string | undefined;
    static attributeTypeMap: Array<{
        name: string;
        baseName: string;
        type: string;
    }>;
    static getAttributeTypeMap(): {
        name: string;
        baseName: string;
        type: string;
    }[];
}
