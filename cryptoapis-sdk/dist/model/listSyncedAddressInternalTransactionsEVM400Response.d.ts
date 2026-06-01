import { ListSyncedAddressInternalTransactionsEVME400 } from './listSyncedAddressInternalTransactionsEVME400';
export declare class ListSyncedAddressInternalTransactionsEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSyncedAddressInternalTransactionsEVME400;
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
