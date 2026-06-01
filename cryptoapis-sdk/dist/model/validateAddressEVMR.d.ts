import { ValidateAddressEVMRData } from './validateAddressEVMRData';
export declare class ValidateAddressEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ValidateAddressEVMRData;
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
