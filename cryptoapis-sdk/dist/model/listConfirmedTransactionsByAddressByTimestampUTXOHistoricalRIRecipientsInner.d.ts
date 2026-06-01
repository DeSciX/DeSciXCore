import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerValue } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerValue';
export declare class ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIRecipientsInner {
    'address'?: string;
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
