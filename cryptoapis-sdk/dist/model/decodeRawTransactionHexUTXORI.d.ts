import { DecodeRawTransactionHexUTXORIInputsInner } from './decodeRawTransactionHexUTXORIInputsInner';
import { DecodeRawTransactionHexUTXORIOutputsInner } from './decodeRawTransactionHexUTXORIOutputsInner';
export declare class DecodeRawTransactionHexUTXORI {
    'id': string;
    'size': number;
    'hash': string;
    'inputs': Array<DecodeRawTransactionHexUTXORIInputsInner>;
    'locktime': number;
    'outputs': Array<DecodeRawTransactionHexUTXORIOutputsInner>;
    'version': number;
    'vsize': number;
    'weight': number;
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
