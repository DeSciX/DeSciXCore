import { DecodeXAddressRI } from './decodeXAddressRI';
export declare class DecodeXAddressRData {
    'item': DecodeXAddressRI;
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
