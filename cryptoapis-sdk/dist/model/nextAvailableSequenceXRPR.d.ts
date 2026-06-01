import { NextAvailableSequenceXRPRData } from './nextAvailableSequenceXRPRData';
export declare class NextAvailableSequenceXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': NextAvailableSequenceXRPRData;
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
