import { GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerScript } from './getTransactionDetailsByTransactionHashUTXOsRIInputsInnerScript';
import { GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerValue } from './getTransactionDetailsByTransactionHashUTXOsRIInputsInnerValue';
export declare class GetTransactionDetailsByTransactionHashUTXOsRIInputsInner {
    'addresses'?: Array<string>;
    'coinbase'?: string;
    'outputIndex': number;
    'script': GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerScript;
    'transactionId': string;
    'value'?: GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerValue;
    'witnesses'?: Array<string>;
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
