import { InsufficientCredits } from './insufficientCredits';
export declare class VerifyAddress402Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': InsufficientCredits;
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
