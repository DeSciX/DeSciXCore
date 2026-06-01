import { ValidateAddressEVMRI } from './validateAddressEVMRI';
export declare class ValidateAddressEVMRData {
    'item': ValidateAddressEVMRI;
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
