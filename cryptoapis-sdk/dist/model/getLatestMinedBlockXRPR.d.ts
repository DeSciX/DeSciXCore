import { GetLatestMinedBlockXRPRData } from './getLatestMinedBlockXRPRData';
export declare class GetLatestMinedBlockXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetLatestMinedBlockXRPRData;
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
