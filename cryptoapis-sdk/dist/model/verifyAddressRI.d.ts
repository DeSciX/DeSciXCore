import { VerifyAddressRISourcesInner } from './verifyAddressRISourcesInner';
export declare class VerifyAddressRI {
    'blockchain'?: string;
    'categories'?: Array<string>;
    'isFlagged': boolean;
    'severity'?: object;
    'sources'?: Array<VerifyAddressRISourcesInner>;
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
