import { SyncAddressE409 } from './syncAddressE409';
export declare class SyncAddress409Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': SyncAddressE409;
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
