import { DeriveAndSyncNewReceivingAddressesXRPRI } from './deriveAndSyncNewReceivingAddressesXRPRI';
export declare class DeriveAndSyncNewReceivingAddressesXRPRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<DeriveAndSyncNewReceivingAddressesXRPRI>;
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
