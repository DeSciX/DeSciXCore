import { NewConfirmedCoinsTransactionsRBData } from './newConfirmedCoinsTransactionsRBData';
export declare class NewConfirmedCoinsTransactionsRB {
    'context'?: string;
    'data': NewConfirmedCoinsTransactionsRBData;
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
