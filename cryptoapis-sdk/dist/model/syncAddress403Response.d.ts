import { SyncAddressE403 } from './syncAddressE403';
export declare class SyncAddress403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': SyncAddressE403;
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
