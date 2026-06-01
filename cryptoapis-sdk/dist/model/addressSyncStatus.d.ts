import { AddressSyncStatusData } from './addressSyncStatusData';
export declare class AddressSyncStatus {
    'apiVersion': string;
    'referenceId': string;
    'idempotencyKey': string;
    'data': AddressSyncStatusData;
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
