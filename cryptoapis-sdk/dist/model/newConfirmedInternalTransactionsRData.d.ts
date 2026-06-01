import { NewConfirmedInternalTransactionsRI } from './newConfirmedInternalTransactionsRI';
export declare class NewConfirmedInternalTransactionsRData {
    'item': NewConfirmedInternalTransactionsRI;
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
