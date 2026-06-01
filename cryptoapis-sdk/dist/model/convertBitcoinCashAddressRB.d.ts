import { ConvertBitcoinCashAddressRBData } from './convertBitcoinCashAddressRBData';
export declare class ConvertBitcoinCashAddressRB {
    'context'?: string;
    'data': ConvertBitcoinCashAddressRBData;
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
