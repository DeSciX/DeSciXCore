import { ConvertBitcoinCashAddressRData } from './convertBitcoinCashAddressRData';
export declare class ConvertBitcoinCashAddressR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ConvertBitcoinCashAddressRData;
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
