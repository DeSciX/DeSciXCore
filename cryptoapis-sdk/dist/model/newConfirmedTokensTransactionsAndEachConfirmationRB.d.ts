import { NewConfirmedTokensTransactionsAndEachConfirmationRBData } from './newConfirmedTokensTransactionsAndEachConfirmationRBData';
export declare class NewConfirmedTokensTransactionsAndEachConfirmationRB {
    'context'?: string;
    'data': NewConfirmedTokensTransactionsAndEachConfirmationRBData;
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
