import { ListLatestMinedBlocksUTXOsRData } from './listLatestMinedBlocksUTXOsRData';
export declare class ListLatestMinedBlocksUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListLatestMinedBlocksUTXOsRData;
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
