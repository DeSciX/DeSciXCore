import { PrepareAFungibleTokenTransferFromAddressEVMRBData } from './prepareAFungibleTokenTransferFromAddressEVMRBData';
export declare class PrepareAFungibleTokenTransferFromAddressEVMRB {
    'context'?: string;
    'data': PrepareAFungibleTokenTransferFromAddressEVMRBData;
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
