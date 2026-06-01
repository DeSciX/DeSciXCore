import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInnerScript } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInnerScript';
import { ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInnerValue } from './listConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInnerValue';
export declare class ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner {
    'addresses'?: Array<string>;
    'isSpent': boolean;
    'script': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInnerScript;
    'value'?: ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInnerValue;
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
