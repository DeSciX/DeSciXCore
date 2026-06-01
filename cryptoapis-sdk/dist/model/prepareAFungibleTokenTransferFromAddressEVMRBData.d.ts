import { PrepareAFungibleTokenTransferFromAddressEVMRBDataItem } from './prepareAFungibleTokenTransferFromAddressEVMRBDataItem';
export declare class PrepareAFungibleTokenTransferFromAddressEVMRBData {
    'item': PrepareAFungibleTokenTransferFromAddressEVMRBDataItem;
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
