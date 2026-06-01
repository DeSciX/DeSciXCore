import { ValidateAddressUTXORI } from './validateAddressUTXORI';
export declare class ValidateAddressUTXORData {
    'item': ValidateAddressUTXORI;
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
