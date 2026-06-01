import { ListTransactionsByBlockHashXRPRI } from './listTransactionsByBlockHashXRPRI';
export declare class ListTransactionsByBlockHashXRPRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListTransactionsByBlockHashXRPRI>;
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
