import { DecodeXAddressE401 } from './decodeXAddressE401';
export declare class DecodeXAddress401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DecodeXAddressE401;
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
