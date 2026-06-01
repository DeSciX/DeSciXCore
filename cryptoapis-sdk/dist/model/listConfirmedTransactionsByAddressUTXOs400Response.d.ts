import { ListConfirmedTransactionsByAddressUTXOsE400 } from './listConfirmedTransactionsByAddressUTXOsE400';
export declare class ListConfirmedTransactionsByAddressUTXOs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressUTXOsE400;
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
