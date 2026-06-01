import { ListUnconfirmedTransactionsByAddressUTXOsRData } from './listUnconfirmedTransactionsByAddressUTXOsRData';
export declare class ListUnconfirmedTransactionsByAddressUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListUnconfirmedTransactionsByAddressUTXOsRData;
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
