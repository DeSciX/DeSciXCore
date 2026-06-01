import { ListSyncedAddressesE400 } from './listSyncedAddressesE400';
export declare class ListSyncedAddresses400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSyncedAddressesE400;
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
