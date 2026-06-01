import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400 } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400';
export declare class ListConfirmedTransactionsByAddressByTimestampUTXOHistorical400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400;
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
