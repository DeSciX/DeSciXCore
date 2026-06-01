import { DecodeRawTransactionHexEVME403 } from './decodeRawTransactionHexEVME403';
export declare class DecodeRawTransactionHexEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DecodeRawTransactionHexEVME403;
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
