import { NewConfirmedTokensTransactionsRI } from './newConfirmedTokensTransactionsRI';
export declare class NewConfirmedTokensTransactionsRData {
    'item': NewConfirmedTokensTransactionsRI;
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
