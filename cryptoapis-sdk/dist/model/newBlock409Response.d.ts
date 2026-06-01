import { NewBlockE409 } from './newBlockE409';
export declare class NewBlock409Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewBlockE409;
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
