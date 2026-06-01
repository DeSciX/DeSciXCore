import { NewConfirmedCoinsTransactionsAndEachConfirmationRBData } from './newConfirmedCoinsTransactionsAndEachConfirmationRBData';
export declare class NewConfirmedCoinsTransactionsAndEachConfirmationRB {
    'context'?: string;
    'data': NewConfirmedCoinsTransactionsAndEachConfirmationRBData;
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
