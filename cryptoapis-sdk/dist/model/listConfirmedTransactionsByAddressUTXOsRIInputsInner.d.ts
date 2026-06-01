import { GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerScript } from './getTransactionDetailsByTransactionHashUTXOsRIInputsInnerScript';
import { ListConfirmedTransactionsByAddressUTXOsRIInputsInnerValue } from './listConfirmedTransactionsByAddressUTXOsRIInputsInnerValue';
export declare class ListConfirmedTransactionsByAddressUTXOsRIInputsInner {
    'addresses'?: Array<string>;
    'coinbase'?: string;
    'outputIndex': number;
    'script': GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerScript;
    'transactionId'?: string;
    'value'?: ListConfirmedTransactionsByAddressUTXOsRIInputsInnerValue;
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
