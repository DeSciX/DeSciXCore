import { DecodeXAddressE400 } from './decodeXAddressE400';
export declare class DecodeXAddress400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DecodeXAddressE400;
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
