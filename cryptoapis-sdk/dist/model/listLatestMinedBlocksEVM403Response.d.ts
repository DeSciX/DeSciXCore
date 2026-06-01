import { ListLatestMinedBlocksEVME403 } from './listLatestMinedBlocksEVME403';
export declare class ListLatestMinedBlocksEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListLatestMinedBlocksEVME403;
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
