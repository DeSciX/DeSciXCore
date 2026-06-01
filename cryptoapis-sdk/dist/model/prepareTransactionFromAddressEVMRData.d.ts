import { PrepareTransactionFromAddressEVMRI } from './prepareTransactionFromAddressEVMRI';
export declare class PrepareTransactionFromAddressEVMRData {
    'item': PrepareTransactionFromAddressEVMRI;
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
