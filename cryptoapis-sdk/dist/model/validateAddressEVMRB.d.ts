import { ValidateAddressEVMRBData } from './validateAddressEVMRBData';
export declare class ValidateAddressEVMRB {
    'context'?: string;
    'data': ValidateAddressEVMRBData;
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
