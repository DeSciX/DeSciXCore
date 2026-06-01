import { ListLatestMinedBlocksUTXOsE401 } from './listLatestMinedBlocksUTXOsE401';
export declare class ListLatestMinedBlocksUTXOs401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListLatestMinedBlocksUTXOsE401;
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
