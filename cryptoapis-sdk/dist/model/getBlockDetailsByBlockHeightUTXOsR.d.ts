import { GetBlockDetailsByBlockHeightUTXOsRData } from './getBlockDetailsByBlockHeightUTXOsRData';
export declare class GetBlockDetailsByBlockHeightUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetBlockDetailsByBlockHeightUTXOsRData;
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
