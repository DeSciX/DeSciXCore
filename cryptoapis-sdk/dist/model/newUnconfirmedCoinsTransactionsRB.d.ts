import { NewUnconfirmedCoinsTransactionsRBData } from './newUnconfirmedCoinsTransactionsRBData';
export declare class NewUnconfirmedCoinsTransactionsRB {
    'context'?: string;
    'data': NewUnconfirmedCoinsTransactionsRBData;
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
