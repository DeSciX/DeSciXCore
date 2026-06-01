import { ValidateAddressEVME403 } from './validateAddressEVME403';
export declare class ValidateAddressEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ValidateAddressEVME403;
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
