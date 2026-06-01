import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerValue } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerValue';
import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInnerScript } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInnerScript';
export declare class ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner {
    'addresses'?: Array<string>;
    'isSpent': boolean;
    'script': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInnerScript;
    'value'?: ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerValue;
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
