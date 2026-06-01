import { ListTransactionsByBlockHashEVMRI } from './listTransactionsByBlockHashEVMRI';
export declare class ListTransactionsByBlockHashEVMRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListTransactionsByBlockHashEVMRI>;
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
