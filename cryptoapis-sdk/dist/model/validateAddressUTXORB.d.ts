import { ValidateAddressUTXORBData } from './validateAddressUTXORBData';
export declare class ValidateAddressUTXORB {
    'context'?: string;
    'data': ValidateAddressUTXORBData;
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
