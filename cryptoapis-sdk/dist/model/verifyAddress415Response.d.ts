import { UnsupportedMediaType } from './unsupportedMediaType';
export declare class VerifyAddress415Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': UnsupportedMediaType;
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
