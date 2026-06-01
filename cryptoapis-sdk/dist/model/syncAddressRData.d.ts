import { SyncAddressRI } from './syncAddressRI';
export declare class SyncAddressRData {
    'item': SyncAddressRI;
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
