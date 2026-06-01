import { SyncAddressNotActive } from './syncAddressNotActive';
export declare class ListConfirmedTransactionsByAddressFromTimestampEVMHistory405Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': SyncAddressNotActive;
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
