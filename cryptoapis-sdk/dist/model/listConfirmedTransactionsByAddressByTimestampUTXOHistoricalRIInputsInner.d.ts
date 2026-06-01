import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerScript } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerScript';
import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerValue } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerValue';
export declare class ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner {
    'addresses'?: Array<string>;
    'coinbase'?: string;
    'outputIndex': number;
    'script': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerScript;
    'transactionId': string;
    'value'?: ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerValue;
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
