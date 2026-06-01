import { GetTokenDetailsByContractAddressEVMRIFungibleValues } from './getTokenDetailsByContractAddressEVMRIFungibleValues';
export declare class GetTokenDetailsByContractAddressEVMRI {
    'name': string;
    'standard': string;
    'symbol': string;
    'fungibleValues'?: GetTokenDetailsByContractAddressEVMRIFungibleValues;
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
