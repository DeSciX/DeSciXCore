import { GetTokenDetailsByContractAddressEVMRI } from './getTokenDetailsByContractAddressEVMRI';
export declare class GetTokenDetailsByContractAddressEVMRData {
    'item': GetTokenDetailsByContractAddressEVMRI;
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
