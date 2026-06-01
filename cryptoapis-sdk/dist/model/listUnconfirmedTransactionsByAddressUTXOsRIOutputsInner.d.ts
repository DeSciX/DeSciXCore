import { ListConfirmedTransactionsByAddressUTXOsRIOutputsInnerScript } from './listConfirmedTransactionsByAddressUTXOsRIOutputsInnerScript';
import { ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInnerValue } from './listUnconfirmedTransactionsByAddressUTXOsRIOutputsInnerValue';
export declare class ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner {
    'addresses'?: Array<string>;
    'isSpent': boolean;
    'script': ListConfirmedTransactionsByAddressUTXOsRIOutputsInnerScript;
    'value'?: ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInnerValue;
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
