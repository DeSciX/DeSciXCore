import { ListLatestMinedBlocksUTXOsE400 } from './listLatestMinedBlocksUTXOsE400';
export declare class ListLatestMinedBlocksUTXOs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListLatestMinedBlocksUTXOsE400;
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
