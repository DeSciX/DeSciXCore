import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerScript } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerScript';
import { ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInnerValue } from './listConfirmedTransactionsByAddressUTXOHistoricalRIInputsInnerValue';
export declare class ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner {
    'addresses'?: Array<string>;
    'coinbase'?: string;
    'outputIndex': number;
    'script': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerScript;
    'transactionId': string;
    'value'?: ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInnerValue;
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
