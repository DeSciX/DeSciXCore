import { GetBlockDetailsByBlockHeightUTXOsE400 } from './getBlockDetailsByBlockHeightUTXOsE400';
export declare class GetBlockDetailsByBlockHeightUTXOs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHeightUTXOsE400;
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
