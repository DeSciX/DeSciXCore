import { ListSyncedAddressesE401 } from './listSyncedAddressesE401';
export declare class ListSyncedAddresses401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSyncedAddressesE401;
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
