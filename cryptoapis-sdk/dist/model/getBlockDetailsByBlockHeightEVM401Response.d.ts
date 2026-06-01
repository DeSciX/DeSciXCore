import { GetBlockDetailsByBlockHeightEVME401 } from './getBlockDetailsByBlockHeightEVME401';
export declare class GetBlockDetailsByBlockHeightEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHeightEVME401;
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
