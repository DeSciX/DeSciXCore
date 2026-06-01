import { AddressSyncStatusDataItem } from './addressSyncStatusDataItem';
export declare class AddressSyncStatusData {
    'product': string;
    'event': string;
    'item': AddressSyncStatusDataItem;
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
