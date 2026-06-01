import { GetLastMinedBlockEVME403 } from './getLastMinedBlockEVME403';
export declare class GetLastMinedBlockEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetLastMinedBlockEVME403;
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
