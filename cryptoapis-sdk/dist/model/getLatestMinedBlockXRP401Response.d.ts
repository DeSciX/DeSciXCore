import { GetLatestMinedBlockXRPE401 } from './getLatestMinedBlockXRPE401';
export declare class GetLatestMinedBlockXRP401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetLatestMinedBlockXRPE401;
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
