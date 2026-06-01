import { ListTransactionsByBlockHeightUTXOsRISendersInnerValue } from './listTransactionsByBlockHeightUTXOsRISendersInnerValue';
export declare class ListTransactionsByBlockHeightUTXOsRISendersInner {
    'address': string;
    'value': ListTransactionsByBlockHeightUTXOsRISendersInnerValue;
    'addresses': string;
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
