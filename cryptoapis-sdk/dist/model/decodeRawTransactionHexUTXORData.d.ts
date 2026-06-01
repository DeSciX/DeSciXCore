import { DecodeRawTransactionHexUTXORI } from './decodeRawTransactionHexUTXORI';
export declare class DecodeRawTransactionHexUTXORData {
    'item': DecodeRawTransactionHexUTXORI;
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
