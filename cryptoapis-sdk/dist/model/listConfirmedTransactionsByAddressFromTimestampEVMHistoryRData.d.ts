import { ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI } from './listConfirmedTransactionsByAddressFromTimestampEVMHistoryRI';
export declare class ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData {
    'limit': number;
    'startingAfter'?: string;
    'hasMore': boolean;
    'nextStartingAfter'?: string;
    'sortingOrder'?: string;
    'items': Array<ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI>;
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
