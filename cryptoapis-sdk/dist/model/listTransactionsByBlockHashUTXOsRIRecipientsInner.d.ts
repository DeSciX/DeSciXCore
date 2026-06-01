import { ListTransactionsByBlockHashUTXOsRIRecipientsInnerValue } from './listTransactionsByBlockHashUTXOsRIRecipientsInnerValue';
export declare class ListTransactionsByBlockHashUTXOsRIRecipientsInner {
    'address': string;
    'value': ListTransactionsByBlockHashUTXOsRIRecipientsInnerValue;
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
