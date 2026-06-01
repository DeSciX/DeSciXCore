import { ListTransactionsByBlockHashUTXOsRISendersInnerValue } from './listTransactionsByBlockHashUTXOsRISendersInnerValue';
export declare class ListTransactionsByBlockHashUTXOsRISendersInner {
    'address': string;
    'value': ListTransactionsByBlockHashUTXOsRISendersInnerValue;
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
