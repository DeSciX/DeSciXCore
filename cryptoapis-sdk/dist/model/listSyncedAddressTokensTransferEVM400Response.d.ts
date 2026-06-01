import { ListSyncedAddressTokensTransferEVME400 } from './listSyncedAddressTokensTransferEVME400';
export declare class ListSyncedAddressTokensTransferEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSyncedAddressTokensTransferEVME400;
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
