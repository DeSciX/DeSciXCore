import { ListSyncedAddressesUTXOE400 } from './listSyncedAddressesUTXOE400';
export declare class ListSyncedAddressesUTXO400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSyncedAddressesUTXOE400;
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
