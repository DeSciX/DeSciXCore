import { GetBlockDetailsByBlockHeightXRPRData } from './getBlockDetailsByBlockHeightXRPRData';
export declare class GetBlockDetailsByBlockHeightXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetBlockDetailsByBlockHeightXRPRData;
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
