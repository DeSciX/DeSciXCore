import { ListConfirmedTransactionsByAddressEVMHistoryRI } from './listConfirmedTransactionsByAddressEVMHistoryRI';
export declare class ListConfirmedTransactionsByAddressEVMHistoryRData {
    'limit': number;
    'startingAfter'?: string;
    'hasMore': boolean;
    'nextStartingAfter'?: string;
    'sortingOrder'?: string;
    'items': Array<ListConfirmedTransactionsByAddressEVMHistoryRI>;
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
