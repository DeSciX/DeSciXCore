import { ListSyncedAddressesE403 } from './listSyncedAddressesE403';
export declare class ListSyncedAddresses403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSyncedAddressesE403;
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
