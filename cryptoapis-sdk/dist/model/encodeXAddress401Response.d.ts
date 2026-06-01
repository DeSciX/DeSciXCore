import { EncodeXAddressE401 } from './encodeXAddressE401';
export declare class EncodeXAddress401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EncodeXAddressE401;
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
