import { InvalidData } from './invalidData';
export declare class VerifyAddress409Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': InvalidData;
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
