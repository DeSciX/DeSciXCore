import { ListSyncedAddressInternalTransactionsEVME401 } from './listSyncedAddressInternalTransactionsEVME401';
export declare class ListSyncedAddressInternalTransactionsEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSyncedAddressInternalTransactionsEVME401;
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
