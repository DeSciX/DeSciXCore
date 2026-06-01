import { VerifyAddressRI } from './verifyAddressRI';
export declare class VerifyAddressRData {
    'item': VerifyAddressRI;
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
