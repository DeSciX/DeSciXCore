import { GetBlockDetailsByBlockHeightEVMRData } from './getBlockDetailsByBlockHeightEVMRData';
export declare class GetBlockDetailsByBlockHeightEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetBlockDetailsByBlockHeightEVMRData;
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
