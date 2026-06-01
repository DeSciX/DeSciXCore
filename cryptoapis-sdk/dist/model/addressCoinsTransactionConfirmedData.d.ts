import { AddressCoinsTransactionConfirmedDataItem } from './addressCoinsTransactionConfirmedDataItem';
export declare class AddressCoinsTransactionConfirmedData {
    'product': string;
    'event': string;
    'item': AddressCoinsTransactionConfirmedDataItem;
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
