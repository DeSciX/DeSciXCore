import { SyncAddressRData } from './syncAddressRData';
export declare class SyncAddressR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': SyncAddressRData;
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
