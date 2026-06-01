import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI';
export declare class ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData {
    'limit': number;
    'startingAfter'?: string;
    'hasMore': boolean;
    'nextStartingAfter'?: string;
    'sortingOrder'?: string;
    'items': Array<ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI>;
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
