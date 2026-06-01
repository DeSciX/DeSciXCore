import { ListLatestMinedBlocksUTXOsE403 } from './listLatestMinedBlocksUTXOsE403';
export declare class ListLatestMinedBlocksUTXOs403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListLatestMinedBlocksUTXOsE403;
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
