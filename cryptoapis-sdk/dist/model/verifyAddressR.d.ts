import { VerifyAddressRData } from './verifyAddressRData';
export declare class VerifyAddressR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': VerifyAddressRData;
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
