import { ListSyncedAddressTokensTransferEVME401 } from './listSyncedAddressTokensTransferEVME401';
export declare class ListSyncedAddressTokensTransferEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSyncedAddressTokensTransferEVME401;
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
