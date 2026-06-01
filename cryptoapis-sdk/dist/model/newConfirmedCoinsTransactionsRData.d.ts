import { NewConfirmedCoinsTransactionsRI } from './newConfirmedCoinsTransactionsRI';
export declare class NewConfirmedCoinsTransactionsRData {
    'item': NewConfirmedCoinsTransactionsRI;
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
