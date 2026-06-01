import { ValidateAddressXRPRBData } from './validateAddressXRPRBData';
export declare class ValidateAddressXRPRB {
    'context'?: string;
    'data': ValidateAddressXRPRBData;
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
