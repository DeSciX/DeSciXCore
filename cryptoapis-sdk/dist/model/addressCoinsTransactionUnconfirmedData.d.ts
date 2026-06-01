import { AddressCoinsTransactionUnconfirmedDataItem } from './addressCoinsTransactionUnconfirmedDataItem';
export declare class AddressCoinsTransactionUnconfirmedData {
    'product': string;
    'event': string;
    'item': AddressCoinsTransactionUnconfirmedDataItem;
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
