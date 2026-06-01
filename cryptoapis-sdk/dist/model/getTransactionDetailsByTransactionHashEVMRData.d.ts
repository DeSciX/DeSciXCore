import { GetTransactionDetailsByTransactionHashEVMRI } from './getTransactionDetailsByTransactionHashEVMRI';
export declare class GetTransactionDetailsByTransactionHashEVMRData {
    'item': GetTransactionDetailsByTransactionHashEVMRI;
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
