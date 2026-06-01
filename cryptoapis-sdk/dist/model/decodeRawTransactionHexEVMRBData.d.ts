import { DecodeRawTransactionHexEVMRBDataItem } from './decodeRawTransactionHexEVMRBDataItem';
export declare class DecodeRawTransactionHexEVMRBData {
    'item': DecodeRawTransactionHexEVMRBDataItem;
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
