import { DeleteSyncedAddressRData } from './deleteSyncedAddressRData';
export declare class DeleteSyncedAddressR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': DeleteSyncedAddressRData;
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
