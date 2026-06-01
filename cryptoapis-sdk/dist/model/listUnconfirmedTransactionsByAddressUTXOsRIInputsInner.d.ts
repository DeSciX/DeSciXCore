import { ListUnconfirmedTransactionsByAddressUTXOsRIInputsInnerScript } from './listUnconfirmedTransactionsByAddressUTXOsRIInputsInnerScript';
import { ListUnconfirmedTransactionsByAddressUTXOsRIInputsInnerValue } from './listUnconfirmedTransactionsByAddressUTXOsRIInputsInnerValue';
export declare class ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner {
    'addresses'?: Array<string>;
    'outputIndex': number;
    'script': ListUnconfirmedTransactionsByAddressUTXOsRIInputsInnerScript;
    'transactionId': string;
    'value'?: ListUnconfirmedTransactionsByAddressUTXOsRIInputsInnerValue;
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
