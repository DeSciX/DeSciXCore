import { ListUnconfirmedTransactionsByAddressUTXOsE403 } from './listUnconfirmedTransactionsByAddressUTXOsE403';
export declare class ListUnconfirmedTransactionsByAddressUTXOs403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListUnconfirmedTransactionsByAddressUTXOsE403;
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
