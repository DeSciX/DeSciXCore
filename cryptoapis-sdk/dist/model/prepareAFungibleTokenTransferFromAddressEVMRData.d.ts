import { PrepareAFungibleTokenTransferFromAddressEVMRI } from './prepareAFungibleTokenTransferFromAddressEVMRI';
export declare class PrepareAFungibleTokenTransferFromAddressEVMRData {
    'item': PrepareAFungibleTokenTransferFromAddressEVMRI;
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
