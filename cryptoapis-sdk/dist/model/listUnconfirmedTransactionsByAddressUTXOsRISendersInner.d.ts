import { ListConfirmedTransactionsByAddressUTXOsRIRecipientsInnerValue } from './listConfirmedTransactionsByAddressUTXOsRIRecipientsInnerValue';
export declare class ListUnconfirmedTransactionsByAddressUTXOsRISendersInner {
    'address': string;
    'value': ListConfirmedTransactionsByAddressUTXOsRIRecipientsInnerValue;
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
