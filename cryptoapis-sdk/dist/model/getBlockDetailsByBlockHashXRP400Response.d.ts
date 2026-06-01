import { GetBlockDetailsByBlockHashXRPE400 } from './getBlockDetailsByBlockHashXRPE400';
export declare class GetBlockDetailsByBlockHashXRP400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHashXRPE400;
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
