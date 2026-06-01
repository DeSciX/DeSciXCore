import { VerifyAddressE400 } from './verifyAddressE400';
export declare class VerifyAddress400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': VerifyAddressE400;
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
