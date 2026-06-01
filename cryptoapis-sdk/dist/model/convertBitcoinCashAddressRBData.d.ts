import { ConvertBitcoinCashAddressRBDataItem } from './convertBitcoinCashAddressRBDataItem';
export declare class ConvertBitcoinCashAddressRBData {
    'item': ConvertBitcoinCashAddressRBDataItem;
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
