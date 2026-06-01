import { DecodeRawTransactionHexUTXORIInputsInnerScript } from './decodeRawTransactionHexUTXORIInputsInnerScript';
export declare class DecodeRawTransactionHexUTXORIInputsInner {
    'address'?: string;
    'outputIndex': number;
    'script': DecodeRawTransactionHexUTXORIInputsInnerScript;
    'sequence': number;
    'transactionId': string;
    'witnesses'?: Array<string>;
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
