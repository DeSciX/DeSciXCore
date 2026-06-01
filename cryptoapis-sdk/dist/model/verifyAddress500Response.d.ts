import { UnexpectedServerError } from './unexpectedServerError';
export declare class VerifyAddress500Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': UnexpectedServerError;
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
