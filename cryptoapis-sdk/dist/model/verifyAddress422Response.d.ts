import { InvalidRequestBodyStructure } from './invalidRequestBodyStructure';
export declare class VerifyAddress422Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': InvalidRequestBodyStructure;
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
