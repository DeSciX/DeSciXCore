import { GetLastMinedBlockEVME401 } from './getLastMinedBlockEVME401';
export declare class GetLastMinedBlockEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetLastMinedBlockEVME401;
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
