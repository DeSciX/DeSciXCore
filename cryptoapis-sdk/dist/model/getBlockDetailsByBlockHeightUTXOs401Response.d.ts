import { GetBlockDetailsByBlockHeightUTXOsE401 } from './getBlockDetailsByBlockHeightUTXOsE401';
export declare class GetBlockDetailsByBlockHeightUTXOs401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHeightUTXOsE401;
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
