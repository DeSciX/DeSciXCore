import { PrepareTransactionFromAddressEVMRBDataItem } from './prepareTransactionFromAddressEVMRBDataItem';
export declare class PrepareTransactionFromAddressEVMRBData {
    'item': PrepareTransactionFromAddressEVMRBDataItem;
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
