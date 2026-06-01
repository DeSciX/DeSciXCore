import { GetBlockDetailsByBlockHashXRPE403 } from './getBlockDetailsByBlockHashXRPE403';
export declare class GetBlockDetailsByBlockHashXRP403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHashXRPE403;
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
