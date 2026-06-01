import { ListLatestMinedBlocksXRPRData } from './listLatestMinedBlocksXRPRData';
export declare class ListLatestMinedBlocksXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListLatestMinedBlocksXRPRData;
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
