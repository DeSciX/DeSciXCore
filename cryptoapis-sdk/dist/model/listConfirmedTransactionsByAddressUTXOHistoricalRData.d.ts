import { ListConfirmedTransactionsByAddressUTXOHistoricalRI } from './listConfirmedTransactionsByAddressUTXOHistoricalRI';
export declare class ListConfirmedTransactionsByAddressUTXOHistoricalRData {
    'limit': number;
    'startingAfter'?: string;
    'hasMore': boolean;
    'nextStartingAfter'?: string;
    'sortingOrder'?: string;
    'items': Array<ListConfirmedTransactionsByAddressUTXOHistoricalRI>;
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
