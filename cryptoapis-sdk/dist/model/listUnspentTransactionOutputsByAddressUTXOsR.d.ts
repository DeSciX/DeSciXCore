import { ListUnspentTransactionOutputsByAddressUTXOsRData } from './listUnspentTransactionOutputsByAddressUTXOsRData';
export declare class ListUnspentTransactionOutputsByAddressUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListUnspentTransactionOutputsByAddressUTXOsRData;
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
