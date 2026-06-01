import { GetLastMinedBlockUTXOsE400 } from './getLastMinedBlockUTXOsE400';
export declare class GetLastMinedBlockUTXOs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetLastMinedBlockUTXOsE400;
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
