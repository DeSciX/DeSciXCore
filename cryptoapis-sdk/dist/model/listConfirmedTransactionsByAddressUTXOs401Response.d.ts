import { ListConfirmedTransactionsByAddressUTXOsE401 } from './listConfirmedTransactionsByAddressUTXOsE401';
export declare class ListConfirmedTransactionsByAddressUTXOs401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressUTXOsE401;
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
