import { GetBlockDetailsByBlockHashUTXOsRData } from './getBlockDetailsByBlockHashUTXOsRData';
export declare class GetBlockDetailsByBlockHashUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetBlockDetailsByBlockHashUTXOsRData;
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
