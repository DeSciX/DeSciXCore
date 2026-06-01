import { NewConfirmedInternalTransactionsAndEachConfirmationRBData } from './newConfirmedInternalTransactionsAndEachConfirmationRBData';
export declare class NewConfirmedInternalTransactionsAndEachConfirmationRB {
    'context'?: string;
    'data': NewConfirmedInternalTransactionsAndEachConfirmationRBData;
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
