import { ConvertBitcoinCashAddressE403 } from './convertBitcoinCashAddressE403';
export declare class ConvertBitcoinCashAddress403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ConvertBitcoinCashAddressE403;
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
