import { DecodeRawTransactionHexEVMRData } from './decodeRawTransactionHexEVMRData';
export declare class DecodeRawTransactionHexEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': DecodeRawTransactionHexEVMRData;
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
