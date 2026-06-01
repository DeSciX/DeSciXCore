import { ListSyncedAddressTokensTransferEVME403 } from './listSyncedAddressTokensTransferEVME403';
export declare class ListSyncedAddressTokensTransferEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSyncedAddressTokensTransferEVME403;
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
