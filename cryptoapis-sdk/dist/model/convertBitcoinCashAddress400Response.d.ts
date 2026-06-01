import { ConvertBitcoinCashAddressE400 } from './convertBitcoinCashAddressE400';
export declare class ConvertBitcoinCashAddress400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ConvertBitcoinCashAddressE400;
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
