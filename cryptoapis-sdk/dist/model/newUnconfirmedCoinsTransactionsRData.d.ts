import { NewUnconfirmedCoinsTransactionsRI } from './newUnconfirmedCoinsTransactionsRI';
export declare class NewUnconfirmedCoinsTransactionsRData {
    'item': NewUnconfirmedCoinsTransactionsRI;
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
