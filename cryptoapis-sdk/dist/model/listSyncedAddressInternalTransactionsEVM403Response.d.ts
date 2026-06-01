import { ListSyncedAddressInternalTransactionsEVME403 } from './listSyncedAddressInternalTransactionsEVME403';
export declare class ListSyncedAddressInternalTransactionsEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSyncedAddressInternalTransactionsEVME403;
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
