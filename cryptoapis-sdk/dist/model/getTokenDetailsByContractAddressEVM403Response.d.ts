import { GetTokenDetailsByContractAddressEVME403 } from './getTokenDetailsByContractAddressEVME403';
export declare class GetTokenDetailsByContractAddressEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTokenDetailsByContractAddressEVME403;
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
