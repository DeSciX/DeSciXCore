import { EncodeXAddressRI } from './encodeXAddressRI';
export declare class EncodeXAddressRData {
    'item': EncodeXAddressRI;
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
