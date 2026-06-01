import { ListUnspentTransactionOutputsByAddressUTXOsE400 } from './listUnspentTransactionOutputsByAddressUTXOsE400';
export declare class ListUnspentTransactionOutputsByAddressUTXOs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListUnspentTransactionOutputsByAddressUTXOsE400;
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
