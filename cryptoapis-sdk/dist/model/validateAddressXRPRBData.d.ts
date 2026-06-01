import { ValidateAddressXRPRBDataItem } from './validateAddressXRPRBDataItem';
export declare class ValidateAddressXRPRBData {
    'item': ValidateAddressXRPRBDataItem;
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
