import { GetLastMinedBlockEVMRData } from './getLastMinedBlockEVMRData';
export declare class GetLastMinedBlockEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetLastMinedBlockEVMRData;
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
