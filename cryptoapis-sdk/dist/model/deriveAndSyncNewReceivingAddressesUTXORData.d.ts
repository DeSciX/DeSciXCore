import { DeriveAndSyncNewReceivingAddressesUTXORI } from './deriveAndSyncNewReceivingAddressesUTXORI';
export declare class DeriveAndSyncNewReceivingAddressesUTXORData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<DeriveAndSyncNewReceivingAddressesUTXORI>;
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
