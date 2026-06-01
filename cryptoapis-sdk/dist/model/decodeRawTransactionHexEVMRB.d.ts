import { DecodeRawTransactionHexEVMRBData } from './decodeRawTransactionHexEVMRBData';
export declare class DecodeRawTransactionHexEVMRB {
    'context'?: string;
    'data': DecodeRawTransactionHexEVMRBData;
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
