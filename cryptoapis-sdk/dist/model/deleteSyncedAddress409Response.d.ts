import { DeleteSyncedAddressE409 } from './deleteSyncedAddressE409';
export declare class DeleteSyncedAddress409Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeleteSyncedAddressE409;
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
