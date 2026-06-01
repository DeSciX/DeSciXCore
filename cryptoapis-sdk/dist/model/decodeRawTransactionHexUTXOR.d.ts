import { DecodeRawTransactionHexUTXORData } from './decodeRawTransactionHexUTXORData';
export declare class DecodeRawTransactionHexUTXOR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': DecodeRawTransactionHexUTXORData;
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
