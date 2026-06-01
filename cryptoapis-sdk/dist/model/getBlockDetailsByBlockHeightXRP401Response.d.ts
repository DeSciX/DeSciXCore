import { GetBlockDetailsByBlockHeightXRPE401 } from './getBlockDetailsByBlockHeightXRPE401';
export declare class GetBlockDetailsByBlockHeightXRP401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHeightXRPE401;
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
