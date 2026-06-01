import { GetLastMinedBlockUTXOsE403 } from './getLastMinedBlockUTXOsE403';
export declare class GetLastMinedBlockUTXOs403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetLastMinedBlockUTXOsE403;
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
