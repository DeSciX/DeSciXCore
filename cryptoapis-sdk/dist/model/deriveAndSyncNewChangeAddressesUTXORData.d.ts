import { DeriveAndSyncNewChangeAddressesUTXORI } from './deriveAndSyncNewChangeAddressesUTXORI';
export declare class DeriveAndSyncNewChangeAddressesUTXORData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<DeriveAndSyncNewChangeAddressesUTXORI>;
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
