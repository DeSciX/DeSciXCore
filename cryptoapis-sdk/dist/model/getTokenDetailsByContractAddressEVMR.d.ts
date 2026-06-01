import { GetTokenDetailsByContractAddressEVMRData } from './getTokenDetailsByContractAddressEVMRData';
export declare class GetTokenDetailsByContractAddressEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetTokenDetailsByContractAddressEVMRData;
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
