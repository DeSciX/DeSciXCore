import { ListLogsByTransactionHashEVMRI } from './listLogsByTransactionHashEVMRI';
export declare class ListLogsByTransactionHashEVMRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListLogsByTransactionHashEVMRI>;
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
