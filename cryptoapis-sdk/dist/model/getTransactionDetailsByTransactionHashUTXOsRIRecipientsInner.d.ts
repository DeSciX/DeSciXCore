import { GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInnerValue } from './getTransactionDetailsByTransactionHashUTXOsRIRecipientsInnerValue';
export declare class GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner {
    'address': string;
    'value': GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInnerValue;
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
