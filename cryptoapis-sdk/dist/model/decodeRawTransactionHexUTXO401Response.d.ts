import { DecodeRawTransactionHexUTXOE401 } from './decodeRawTransactionHexUTXOE401';
export declare class DecodeRawTransactionHexUTXO401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DecodeRawTransactionHexUTXOE401;
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
