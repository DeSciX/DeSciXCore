import { NextAvailableSequenceXRPE403 } from './nextAvailableSequenceXRPE403';
export declare class NextAvailableSequenceXRP403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NextAvailableSequenceXRPE403;
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
