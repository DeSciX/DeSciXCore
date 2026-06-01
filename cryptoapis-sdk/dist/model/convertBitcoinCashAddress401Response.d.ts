import { ConvertBitcoinCashAddressE401 } from './convertBitcoinCashAddressE401';
export declare class ConvertBitcoinCashAddress401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ConvertBitcoinCashAddressE401;
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
