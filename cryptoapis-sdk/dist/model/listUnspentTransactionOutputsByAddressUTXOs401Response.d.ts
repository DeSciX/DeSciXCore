import { ListUnspentTransactionOutputsByAddressUTXOsE401 } from './listUnspentTransactionOutputsByAddressUTXOsE401';
export declare class ListUnspentTransactionOutputsByAddressUTXOs401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListUnspentTransactionOutputsByAddressUTXOsE401;
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
