import { DecodeXAddressRData } from './decodeXAddressRData';
export declare class DecodeXAddressR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': DecodeXAddressRData;
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
