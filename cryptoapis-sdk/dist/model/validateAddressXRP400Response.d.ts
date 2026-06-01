import { ValidateAddressXRPE400 } from './validateAddressXRPE400';
export declare class ValidateAddressXRP400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ValidateAddressXRPE400;
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
