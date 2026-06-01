import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInnerScript } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInnerScript';
import { ListTransactionsByBlockHashUTXOsRIOutputsInnerValue } from './listTransactionsByBlockHashUTXOsRIOutputsInnerValue';
export declare class ListTransactionsByBlockHashUTXOsRIOutputsInner {
    'addresses'?: Array<string>;
    'isSpent': boolean;
    'script': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInnerScript;
    'value'?: ListTransactionsByBlockHashUTXOsRIOutputsInnerValue;
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
