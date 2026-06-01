import { PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem } from './prepareANonFungibleTokenTransferFromAddressEVMRBDataItem';
export declare class PrepareANonFungibleTokenTransferFromAddressEVMRBData {
    'item': PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem;
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
