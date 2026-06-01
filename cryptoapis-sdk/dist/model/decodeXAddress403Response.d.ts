import { DecodeXAddressE403 } from './decodeXAddressE403';
export declare class DecodeXAddress403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DecodeXAddressE403;
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
