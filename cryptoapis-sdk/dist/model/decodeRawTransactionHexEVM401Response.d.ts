import { DecodeRawTransactionHexEVME401 } from './decodeRawTransactionHexEVME401';
export declare class DecodeRawTransactionHexEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DecodeRawTransactionHexEVME401;
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
