import { ListUnconfirmedTransactionsByAddressUTXOsE400 } from './listUnconfirmedTransactionsByAddressUTXOsE400';
export declare class ListUnconfirmedTransactionsByAddressUTXOs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListUnconfirmedTransactionsByAddressUTXOsE400;
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
