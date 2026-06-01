import { GetBlockDetailsByBlockHashXRPRData } from './getBlockDetailsByBlockHashXRPRData';
export declare class GetBlockDetailsByBlockHashXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetBlockDetailsByBlockHashXRPRData;
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
