import { PrepareANonFungibleTokenTransferFromAddressEVMRBData } from './prepareANonFungibleTokenTransferFromAddressEVMRBData';
export declare class PrepareANonFungibleTokenTransferFromAddressEVMRB {
    'context'?: string;
    'data': PrepareANonFungibleTokenTransferFromAddressEVMRBData;
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
