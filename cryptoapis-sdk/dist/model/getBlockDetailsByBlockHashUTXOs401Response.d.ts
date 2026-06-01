import { GetBlockDetailsByBlockHashUTXOsE401 } from './getBlockDetailsByBlockHashUTXOsE401';
export declare class GetBlockDetailsByBlockHashUTXOs401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHashUTXOsE401;
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
