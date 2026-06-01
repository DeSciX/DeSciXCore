import { ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInnerValue } from './listUnconfirmedTransactionsByAddressUTXOsRIRecipientsInnerValue';
export declare class ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner {
    'address': string;
    'value': ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInnerValue;
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
