import { ListSyncedAddressesEVMRData } from './listSyncedAddressesEVMRData';
export declare class ListSyncedAddressesEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListSyncedAddressesEVMRData;
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
