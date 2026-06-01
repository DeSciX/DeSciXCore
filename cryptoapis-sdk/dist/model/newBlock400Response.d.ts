import { NewBlockE400 } from './newBlockE400';
export declare class NewBlock400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewBlockE400;
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
