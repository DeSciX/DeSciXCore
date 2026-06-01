import { ValidateAddressEVMRBDataItem } from './validateAddressEVMRBDataItem';
export declare class ValidateAddressEVMRBData {
    'item': ValidateAddressEVMRBDataItem;
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
