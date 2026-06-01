import { NewConfirmedInternalTransactionsRBData } from './newConfirmedInternalTransactionsRBData';
export declare class NewConfirmedInternalTransactionsRB {
    'context'?: string;
    'data': NewConfirmedInternalTransactionsRBData;
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
