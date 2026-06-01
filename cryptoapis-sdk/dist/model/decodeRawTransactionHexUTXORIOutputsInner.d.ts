import { DecodeRawTransactionHexUTXORIOutputsInnerScript } from './decodeRawTransactionHexUTXORIOutputsInnerScript';
import { DecodeRawTransactionHexUTXORIOutputsInnerValue } from './decodeRawTransactionHexUTXORIOutputsInnerValue';
export declare class DecodeRawTransactionHexUTXORIOutputsInner {
    'address'?: string;
    'script': DecodeRawTransactionHexUTXORIOutputsInnerScript;
    'value'?: DecodeRawTransactionHexUTXORIOutputsInnerValue;
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
