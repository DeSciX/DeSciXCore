import { ListLatestMinedBlocksEVME400 } from './listLatestMinedBlocksEVME400';
export declare class ListLatestMinedBlocksEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListLatestMinedBlocksEVME400;
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
