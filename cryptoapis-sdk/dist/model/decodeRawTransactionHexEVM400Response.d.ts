import { DecodeRawTransactionHexEVME400 } from './decodeRawTransactionHexEVME400';
export declare class DecodeRawTransactionHexEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DecodeRawTransactionHexEVME400;
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
