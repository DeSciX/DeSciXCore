import { AddressTokensTransactionConfirmedDataItem } from './addressTokensTransactionConfirmedDataItem';
export declare class AddressTokensTransactionConfirmedData {
    'product': string;
    'event': string;
    'item': AddressTokensTransactionConfirmedDataItem;
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
