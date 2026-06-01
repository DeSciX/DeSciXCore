import { ListUnconfirmedTransactionsByAddressUTXOsE401 } from './listUnconfirmedTransactionsByAddressUTXOsE401';
export declare class ListUnconfirmedTransactionsByAddressUTXOs401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListUnconfirmedTransactionsByAddressUTXOsE401;
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
