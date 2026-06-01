import { ListSyncedAddressesUTXORI } from './listSyncedAddressesUTXORI';
export declare class ListSyncedAddressesUTXORData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListSyncedAddressesUTXORI>;
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
