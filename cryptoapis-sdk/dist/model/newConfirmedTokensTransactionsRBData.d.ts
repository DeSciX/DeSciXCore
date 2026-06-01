import { NewConfirmedTokensTransactionsRBDataItem } from './newConfirmedTokensTransactionsRBDataItem';
export declare class NewConfirmedTokensTransactionsRBData {
    'item': NewConfirmedTokensTransactionsRBDataItem;
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
