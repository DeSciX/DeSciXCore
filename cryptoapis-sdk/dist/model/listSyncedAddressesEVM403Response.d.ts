import { ListSyncedAddressesEVME403 } from './listSyncedAddressesEVME403';
export declare class ListSyncedAddressesEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSyncedAddressesEVME403;
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
