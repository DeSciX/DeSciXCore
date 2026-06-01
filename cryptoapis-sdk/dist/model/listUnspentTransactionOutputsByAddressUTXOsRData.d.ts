import { ListUnspentTransactionOutputsByAddressUTXOsRI } from './listUnspentTransactionOutputsByAddressUTXOsRI';
export declare class ListUnspentTransactionOutputsByAddressUTXOsRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListUnspentTransactionOutputsByAddressUTXOsRI>;
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
