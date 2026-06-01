import { DecodeRawTransactionHexUTXOE403 } from './decodeRawTransactionHexUTXOE403';
export declare class DecodeRawTransactionHexUTXO403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DecodeRawTransactionHexUTXOE403;
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
