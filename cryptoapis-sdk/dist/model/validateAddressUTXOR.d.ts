import { ValidateAddressUTXORData } from './validateAddressUTXORData';
export declare class ValidateAddressUTXOR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ValidateAddressUTXORData;
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
