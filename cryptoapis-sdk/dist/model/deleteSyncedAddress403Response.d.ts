import { DeleteSyncedAddressE403 } from './deleteSyncedAddressE403';
export declare class DeleteSyncedAddress403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeleteSyncedAddressE403;
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
