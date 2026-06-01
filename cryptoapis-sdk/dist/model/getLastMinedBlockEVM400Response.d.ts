import { GetLastMinedBlockEVME400 } from './getLastMinedBlockEVME400';
export declare class GetLastMinedBlockEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetLastMinedBlockEVME400;
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
