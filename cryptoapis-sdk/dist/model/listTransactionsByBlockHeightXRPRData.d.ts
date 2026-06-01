import { ListTransactionsByBlockHeightXRPRI } from './listTransactionsByBlockHeightXRPRI';
export declare class ListTransactionsByBlockHeightXRPRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListTransactionsByBlockHeightXRPRI>;
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
