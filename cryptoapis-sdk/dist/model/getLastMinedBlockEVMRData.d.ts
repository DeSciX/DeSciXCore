import { GetLastMinedBlockEVMRI } from './getLastMinedBlockEVMRI';
export declare class GetLastMinedBlockEVMRData {
    'item': GetLastMinedBlockEVMRI;
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
