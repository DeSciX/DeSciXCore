import { KaspaAddressCoinsTransactionConfirmedDataItem } from './kaspaAddressCoinsTransactionConfirmedDataItem';
export declare class KaspaAddressCoinsTransactionConfirmedData {
    'product': string;
    'event': string;
    'item': KaspaAddressCoinsTransactionConfirmedDataItem;
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
