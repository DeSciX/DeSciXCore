import { DecodeRawTransactionHexUTXORBDataItem } from './decodeRawTransactionHexUTXORBDataItem';
export declare class DecodeRawTransactionHexUTXORBData {
    'item': DecodeRawTransactionHexUTXORBDataItem;
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
