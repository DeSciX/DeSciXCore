import { GetLastMinedBlockUTXOsRData } from './getLastMinedBlockUTXOsRData';
export declare class GetLastMinedBlockUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetLastMinedBlockUTXOsRData;
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
