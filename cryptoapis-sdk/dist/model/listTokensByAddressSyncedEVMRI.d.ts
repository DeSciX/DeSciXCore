import { ListTokensByAddressSyncedEVMRIFungibleValues } from './listTokensByAddressSyncedEVMRIFungibleValues';
export declare class ListTokensByAddressSyncedEVMRI {
    'name': string;
    'standard': string;
    'symbol': string;
    'contractAddress': string;
    'fungibleValues': ListTokensByAddressSyncedEVMRIFungibleValues;
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
