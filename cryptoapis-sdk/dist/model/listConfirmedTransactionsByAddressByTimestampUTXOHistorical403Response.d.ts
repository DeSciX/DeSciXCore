import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403 } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403';
export declare class ListConfirmedTransactionsByAddressByTimestampUTXOHistorical403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403;
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
