import { DecodeRawTransactionHexUTXORBData } from './decodeRawTransactionHexUTXORBData';
export declare class DecodeRawTransactionHexUTXORB {
    'context'?: string;
    'data': DecodeRawTransactionHexUTXORBData;
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
