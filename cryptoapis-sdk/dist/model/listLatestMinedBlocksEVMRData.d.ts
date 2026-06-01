import { ListLatestMinedBlocksEVMRI } from './listLatestMinedBlocksEVMRI';
export declare class ListLatestMinedBlocksEVMRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListLatestMinedBlocksEVMRI>;
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
