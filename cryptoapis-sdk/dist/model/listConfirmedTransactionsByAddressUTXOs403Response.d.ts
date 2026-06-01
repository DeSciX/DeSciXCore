import { ListConfirmedTransactionsByAddressUTXOsE403 } from './listConfirmedTransactionsByAddressUTXOsE403';
export declare class ListConfirmedTransactionsByAddressUTXOs403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressUTXOsE403;
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
