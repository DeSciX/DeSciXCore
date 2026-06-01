import { RequestLimitReached } from './requestLimitReached';
export declare class VerifyAddress429Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': RequestLimitReached;
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
