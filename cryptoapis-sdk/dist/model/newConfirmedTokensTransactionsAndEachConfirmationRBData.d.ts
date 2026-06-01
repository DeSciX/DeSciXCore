import { NewConfirmedTokensTransactionsAndEachConfirmationRBDataItem } from './newConfirmedTokensTransactionsAndEachConfirmationRBDataItem';
export declare class NewConfirmedTokensTransactionsAndEachConfirmationRBData {
    'item': NewConfirmedTokensTransactionsAndEachConfirmationRBDataItem;
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
