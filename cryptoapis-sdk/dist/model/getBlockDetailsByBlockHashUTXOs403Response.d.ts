import { GetBlockDetailsByBlockHashUTXOsE403 } from './getBlockDetailsByBlockHashUTXOsE403';
export declare class GetBlockDetailsByBlockHashUTXOs403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHashUTXOsE403;
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
