import { ListTransactionsByAddressXRPRI } from './listTransactionsByAddressXRPRI';
export declare class ListTransactionsByAddressXRPRData {
    'limit': number;
    'startingAfter'?: string;
    'hasMore': boolean;
    'nextStartingAfter'?: string;
    'sortingOrder'?: string;
    'items': Array<ListTransactionsByAddressXRPRI>;
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
