import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerScript } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerScript';
import { ListTransactionsByBlockHashUTXOsRIInputsInnerValue } from './listTransactionsByBlockHashUTXOsRIInputsInnerValue';
export declare class ListTransactionsByBlockHashUTXOsRIInputsInner {
    'addresses'?: Array<string>;
    'coinbase'?: string;
    'oututIndex': number;
    'script': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerScript;
    'transactionId': string;
    'value'?: ListTransactionsByBlockHashUTXOsRIInputsInnerValue;
    'witnesses': Array<string>;
    'outputIndex': number;
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
