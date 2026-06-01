import { GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerScript } from './getTransactionDetailsByTransactionHashUTXOsRIInputsInnerScript';
import { ListTransactionsByBlockHeightUTXOsRIInputsInnerValue } from './listTransactionsByBlockHeightUTXOsRIInputsInnerValue';
export declare class ListTransactionsByBlockHeightUTXOsRIInputsInner {
    'addresses'?: Array<string>;
    'coinbase'?: string;
    'outputIndex': number;
    'script': GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerScript;
    'transactionId': string;
    'value'?: ListTransactionsByBlockHeightUTXOsRIInputsInnerValue;
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
