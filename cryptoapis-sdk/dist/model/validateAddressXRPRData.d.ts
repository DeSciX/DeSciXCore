import { ValidateAddressXRPRI } from './validateAddressXRPRI';
export declare class ValidateAddressXRPRData {
    'item': ValidateAddressXRPRI;
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
