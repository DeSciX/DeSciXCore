import { ListConfirmedTransactionsByAddressUTXOHistoricalRIRecipientsInnerValue } from './listConfirmedTransactionsByAddressUTXOHistoricalRIRecipientsInnerValue';
export declare class ListConfirmedTransactionsByAddressUTXOHistoricalRIRecipientsInner {
    'address': string;
    'value': ListConfirmedTransactionsByAddressUTXOHistoricalRIRecipientsInnerValue;
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
