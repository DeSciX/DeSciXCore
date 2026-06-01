import { ConvertBitcoinCashAddressRI } from './convertBitcoinCashAddressRI';
export declare class ConvertBitcoinCashAddressRData {
    'item': ConvertBitcoinCashAddressRI;
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
