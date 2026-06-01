import { NextAvailableSequenceXRPE401 } from './nextAvailableSequenceXRPE401';
export declare class NextAvailableSequenceXRP401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NextAvailableSequenceXRPE401;
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
