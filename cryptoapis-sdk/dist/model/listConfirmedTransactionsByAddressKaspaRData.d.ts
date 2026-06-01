import { ListConfirmedTransactionsByAddressKaspaRI } from './listConfirmedTransactionsByAddressKaspaRI';
export declare class ListConfirmedTransactionsByAddressKaspaRData {
    'limit': number;
    'startingAfter'?: string;
    'hasMore': boolean;
    'nextStartingAfter'?: string;
    'sortingOrder'?: string;
    'items': Array<ListConfirmedTransactionsByAddressKaspaRI>;
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
