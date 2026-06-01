import { ListConfirmedTransactionsByAddressUTXOHistoricalRISendersInnerValue } from './listConfirmedTransactionsByAddressUTXOHistoricalRISendersInnerValue';
export declare class ListConfirmedTransactionsByAddressUTXOHistoricalRISendersInner {
    'address': string;
    'value': ListConfirmedTransactionsByAddressUTXOHistoricalRISendersInnerValue;
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
