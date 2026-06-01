import { GetBlockDetailsByBlockHeightXRPE400 } from './getBlockDetailsByBlockHeightXRPE400';
export declare class GetBlockDetailsByBlockHeightXRP400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHeightXRPE400;
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
