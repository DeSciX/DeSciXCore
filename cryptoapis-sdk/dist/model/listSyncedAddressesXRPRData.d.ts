import { ListSyncedAddressesXRPRI } from './listSyncedAddressesXRPRI';
export declare class ListSyncedAddressesXRPRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListSyncedAddressesXRPRI>;
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
