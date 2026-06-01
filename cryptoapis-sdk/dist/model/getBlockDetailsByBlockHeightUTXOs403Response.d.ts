import { GetBlockDetailsByBlockHeightUTXOsE403 } from './getBlockDetailsByBlockHeightUTXOsE403';
export declare class GetBlockDetailsByBlockHeightUTXOs403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHeightUTXOsE403;
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
