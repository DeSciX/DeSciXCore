import { GetBlockDetailsByBlockHashXRPE401 } from './getBlockDetailsByBlockHashXRPE401';
export declare class GetBlockDetailsByBlockHashXRP401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHashXRPE401;
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
