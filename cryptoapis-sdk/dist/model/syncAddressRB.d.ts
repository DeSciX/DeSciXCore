import { SyncAddressRBData } from './syncAddressRBData';
export declare class SyncAddressRB {
    'context'?: string;
    'data': SyncAddressRBData;
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
