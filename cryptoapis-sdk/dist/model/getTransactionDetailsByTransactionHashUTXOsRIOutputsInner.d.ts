import { GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerValue } from './getTransactionDetailsByTransactionHashUTXOsRIInputsInnerValue';
import { GetTransactionDetailsByTransactionHashUTXOsRIOutputsInnerScript } from './getTransactionDetailsByTransactionHashUTXOsRIOutputsInnerScript';
export declare class GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner {
    'addresses'?: Array<string>;
    'isSpent': boolean;
    'script': GetTransactionDetailsByTransactionHashUTXOsRIOutputsInnerScript;
    'value'?: GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerValue;
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
