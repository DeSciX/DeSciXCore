import { EncodeXAddressE400 } from './encodeXAddressE400';
export declare class EncodeXAddress400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EncodeXAddressE400;
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
