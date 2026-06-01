import { ValidateAddressXRPE401 } from './validateAddressXRPE401';
export declare class ValidateAddressXRP401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ValidateAddressXRPE401;
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
