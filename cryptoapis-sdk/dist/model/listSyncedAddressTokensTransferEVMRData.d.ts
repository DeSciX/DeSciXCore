import { ListSyncedAddressTokensTransferEVMRI } from './listSyncedAddressTokensTransferEVMRI';
export declare class ListSyncedAddressTokensTransferEVMRData {
    'limit': number;
    'startingAfter'?: string;
    'hasMore': boolean;
    'nextStartingAfter'?: string;
    'sortingOrder'?: string;
    'items': Array<ListSyncedAddressTokensTransferEVMRI>;
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
