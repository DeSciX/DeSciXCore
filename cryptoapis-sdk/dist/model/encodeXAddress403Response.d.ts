import { EncodeXAddressE403 } from './encodeXAddressE403';
export declare class EncodeXAddress403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EncodeXAddressE403;
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
