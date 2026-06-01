import { NewBlockRData } from './newBlockRData';
export declare class NewBlockR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': NewBlockRData;
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
