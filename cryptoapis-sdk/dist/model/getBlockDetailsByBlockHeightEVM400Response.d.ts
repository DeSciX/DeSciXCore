import { GetBlockDetailsByBlockHeightEVME400 } from './getBlockDetailsByBlockHeightEVME400';
export declare class GetBlockDetailsByBlockHeightEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHeightEVME400;
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
