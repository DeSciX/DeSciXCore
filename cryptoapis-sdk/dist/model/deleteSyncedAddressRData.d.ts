import { DeleteSyncedAddressRI } from './deleteSyncedAddressRI';
export declare class DeleteSyncedAddressRData {
    'item': DeleteSyncedAddressRI;
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
