import { ListTransactionsByBlockHeightUTXOsRI } from './listTransactionsByBlockHeightUTXOsRI';
export declare class ListTransactionsByBlockHeightUTXOsRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListTransactionsByBlockHeightUTXOsRI>;
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
