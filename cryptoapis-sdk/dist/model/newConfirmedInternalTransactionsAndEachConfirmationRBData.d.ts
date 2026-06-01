import { NewConfirmedInternalTransactionsAndEachConfirmationRBDataItem } from './newConfirmedInternalTransactionsAndEachConfirmationRBDataItem';
export declare class NewConfirmedInternalTransactionsAndEachConfirmationRBData {
    'item': NewConfirmedInternalTransactionsAndEachConfirmationRBDataItem;
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
