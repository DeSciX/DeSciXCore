import { ListLatestMinedBlocksEVMRData } from './listLatestMinedBlocksEVMRData';
export declare class ListLatestMinedBlocksEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListLatestMinedBlocksEVMRData;
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
