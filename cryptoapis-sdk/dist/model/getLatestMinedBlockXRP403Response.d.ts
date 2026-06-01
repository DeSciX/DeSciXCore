import { GetLatestMinedBlockXRPE403 } from './getLatestMinedBlockXRPE403';
export declare class GetLatestMinedBlockXRP403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetLatestMinedBlockXRPE403;
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
