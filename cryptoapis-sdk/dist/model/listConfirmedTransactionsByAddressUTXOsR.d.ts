import { ListConfirmedTransactionsByAddressUTXOsRData } from './listConfirmedTransactionsByAddressUTXOsRData';
export declare class ListConfirmedTransactionsByAddressUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListConfirmedTransactionsByAddressUTXOsRData;
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
