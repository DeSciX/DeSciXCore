import { ValidateAddressXRPRData } from './validateAddressXRPRData';
export declare class ValidateAddressXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ValidateAddressXRPRData;
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
