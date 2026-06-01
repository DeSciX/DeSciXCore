import { ListConfirmedTransactionsByAddressUTXOHistoricalRData } from './listConfirmedTransactionsByAddressUTXOHistoricalRData';
export declare class ListConfirmedTransactionsByAddressUTXOHistoricalR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListConfirmedTransactionsByAddressUTXOHistoricalRData;
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
