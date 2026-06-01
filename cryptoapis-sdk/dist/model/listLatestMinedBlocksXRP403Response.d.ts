import { ListLatestMinedBlocksXRPE403 } from './listLatestMinedBlocksXRPE403';
export declare class ListLatestMinedBlocksXRP403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListLatestMinedBlocksXRPE403;
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
