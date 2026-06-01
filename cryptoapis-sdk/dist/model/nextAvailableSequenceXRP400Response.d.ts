import { NextAvailableSequenceXRPE400 } from './nextAvailableSequenceXRPE400';
export declare class NextAvailableSequenceXRP400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NextAvailableSequenceXRPE400;
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
