import { NewBlockE401 } from './newBlockE401';
export declare class NewBlock401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewBlockE401;
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
