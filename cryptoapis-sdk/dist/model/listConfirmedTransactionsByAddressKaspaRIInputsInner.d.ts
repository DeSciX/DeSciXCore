import { GetTransactionDetailsByTransactionIdKaspaRIInputsInnerValue } from './getTransactionDetailsByTransactionIdKaspaRIInputsInnerValue';
export declare class ListConfirmedTransactionsByAddressKaspaRIInputsInner {
    'address'?: string;
    'outputIndex': number;
    'transactionId': string;
    'value': GetTransactionDetailsByTransactionIdKaspaRIInputsInnerValue;
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
