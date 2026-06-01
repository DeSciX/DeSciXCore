import { NewConfirmedInternalTransactionsRBDataItem } from './newConfirmedInternalTransactionsRBDataItem';
export declare class NewConfirmedInternalTransactionsRBData {
    'item': NewConfirmedInternalTransactionsRBDataItem;
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
