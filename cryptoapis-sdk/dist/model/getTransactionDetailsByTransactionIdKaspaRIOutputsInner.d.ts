import { GetTransactionDetailsByTransactionIdKaspaRIOutputsInnerValue } from './getTransactionDetailsByTransactionIdKaspaRIOutputsInnerValue';
export declare class GetTransactionDetailsByTransactionIdKaspaRIOutputsInner {
    'address': string;
    'value': GetTransactionDetailsByTransactionIdKaspaRIOutputsInnerValue;
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
