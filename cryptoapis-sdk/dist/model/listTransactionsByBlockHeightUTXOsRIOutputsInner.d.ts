import { GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerValue } from './getTransactionDetailsByTransactionHashUTXOsRIInputsInnerValue';
import { ListConfirmedTransactionsByAddressUTXOsRIOutputsInnerScript } from './listConfirmedTransactionsByAddressUTXOsRIOutputsInnerScript';
export declare class ListTransactionsByBlockHeightUTXOsRIOutputsInner {
    'addresses'?: Array<string>;
    'isSpent': boolean;
    'script': ListConfirmedTransactionsByAddressUTXOsRIOutputsInnerScript;
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
