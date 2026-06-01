import { ListTransactionsByBlockHeightUTXOsRIRecipientsInnerValue } from './listTransactionsByBlockHeightUTXOsRIRecipientsInnerValue';
export declare class ListTransactionsByBlockHeightUTXOsRIRecipientsInner {
    'address': string;
    'value': ListTransactionsByBlockHeightUTXOsRIRecipientsInnerValue;
    'addresses': string;
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
