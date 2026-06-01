import { NewConfirmedTokensTransactionsRBData } from './newConfirmedTokensTransactionsRBData';
export declare class NewConfirmedTokensTransactionsRB {
    'context'?: string;
    'data': NewConfirmedTokensTransactionsRBData;
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
