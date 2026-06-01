import { GetTokenDetailsByContractAddressEVME401 } from './getTokenDetailsByContractAddressEVME401';
export declare class GetTokenDetailsByContractAddressEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTokenDetailsByContractAddressEVME401;
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
