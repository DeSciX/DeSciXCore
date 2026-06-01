import { ValidateAddressEVME400 } from './validateAddressEVME400';
export declare class ValidateAddressEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ValidateAddressEVME400;
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
