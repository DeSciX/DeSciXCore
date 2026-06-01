import { ValidateAddressEVME401 } from './validateAddressEVME401';
export declare class ValidateAddressEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ValidateAddressEVME401;
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
