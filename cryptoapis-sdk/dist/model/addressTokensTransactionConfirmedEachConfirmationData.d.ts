import { AddressTokensTransactionConfirmedEachConfirmationDataItem } from './addressTokensTransactionConfirmedEachConfirmationDataItem';
export declare class AddressTokensTransactionConfirmedEachConfirmationData {
    'product': string;
    'event': string;
    'item': AddressTokensTransactionConfirmedEachConfirmationDataItem;
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
