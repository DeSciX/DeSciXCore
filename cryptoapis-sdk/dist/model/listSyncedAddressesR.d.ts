import { ListSyncedAddressesRData } from './listSyncedAddressesRData';
export declare class ListSyncedAddressesR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListSyncedAddressesRData;
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
