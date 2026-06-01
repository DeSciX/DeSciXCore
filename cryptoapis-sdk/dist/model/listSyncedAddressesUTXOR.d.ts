import { ListSyncedAddressesUTXORData } from './listSyncedAddressesUTXORData';
export declare class ListSyncedAddressesUTXOR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListSyncedAddressesUTXORData;
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
