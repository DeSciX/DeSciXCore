import { ListInternalTransactionDetailsByTransactionHashEVMRI } from './listInternalTransactionDetailsByTransactionHashEVMRI';
export declare class ListInternalTransactionDetailsByTransactionHashEVMRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListInternalTransactionDetailsByTransactionHashEVMRI>;
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
