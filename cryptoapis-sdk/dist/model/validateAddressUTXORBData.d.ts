import { ValidateAddressUTXORBDataItem } from './validateAddressUTXORBDataItem';
export declare class ValidateAddressUTXORBData {
    'item': ValidateAddressUTXORBDataItem;
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
