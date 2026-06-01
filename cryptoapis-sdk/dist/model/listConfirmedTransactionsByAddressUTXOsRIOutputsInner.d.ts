import { ListConfirmedTransactionsByAddressUTXOsRIInputsInnerValue } from './listConfirmedTransactionsByAddressUTXOsRIInputsInnerValue';
import { ListConfirmedTransactionsByAddressUTXOsRIOutputsInnerScript } from './listConfirmedTransactionsByAddressUTXOsRIOutputsInnerScript';
export declare class ListConfirmedTransactionsByAddressUTXOsRIOutputsInner {
    'addresses'?: Array<string>;
    'isSpent': boolean;
    'script': ListConfirmedTransactionsByAddressUTXOsRIOutputsInnerScript;
    'value'?: ListConfirmedTransactionsByAddressUTXOsRIInputsInnerValue;
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
