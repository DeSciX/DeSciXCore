import { GetTransactionDetailsByTransactionHashUTXOsRISendersInnerValue } from './getTransactionDetailsByTransactionHashUTXOsRISendersInnerValue';
export declare class GetTransactionDetailsByTransactionHashUTXOsRISendersInner {
    'address': string;
    'value': GetTransactionDetailsByTransactionHashUTXOsRISendersInnerValue;
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
