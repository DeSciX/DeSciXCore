import { GetBlockDetailsByBlockHeightXRPE403 } from './getBlockDetailsByBlockHeightXRPE403';
export declare class GetBlockDetailsByBlockHeightXRP403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHeightXRPE403;
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
