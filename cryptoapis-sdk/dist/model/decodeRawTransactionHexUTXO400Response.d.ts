import { DecodeRawTransactionHexUTXOE400 } from './decodeRawTransactionHexUTXOE400';
export declare class DecodeRawTransactionHexUTXO400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DecodeRawTransactionHexUTXOE400;
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
