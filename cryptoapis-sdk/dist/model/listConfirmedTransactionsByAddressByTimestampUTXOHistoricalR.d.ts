import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData';
export declare class ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData;
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
