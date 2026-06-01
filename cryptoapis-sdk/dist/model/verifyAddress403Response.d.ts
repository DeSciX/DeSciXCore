import { VerifyAddressE403 } from './verifyAddressE403';
export declare class VerifyAddress403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': VerifyAddressE403;
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
