import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401 } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401';
export declare class ListConfirmedTransactionsByAddressByTimestampUTXOHistorical401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401;
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
