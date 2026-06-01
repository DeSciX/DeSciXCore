import { DecodeRawTransactionHexEVMRI } from './decodeRawTransactionHexEVMRI';
export declare class DecodeRawTransactionHexEVMRData {
    'item': DecodeRawTransactionHexEVMRI;
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
