import { EncodeXAddressRData } from './encodeXAddressRData';
export declare class EncodeXAddressR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': EncodeXAddressRData;
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
