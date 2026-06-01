import { VerifyAddressE401 } from './verifyAddressE401';
export declare class VerifyAddress401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': VerifyAddressE401;
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
