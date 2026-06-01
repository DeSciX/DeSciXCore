import { ValidateAddressXRPE403 } from './validateAddressXRPE403';
export declare class ValidateAddressXRP403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ValidateAddressXRPE403;
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
