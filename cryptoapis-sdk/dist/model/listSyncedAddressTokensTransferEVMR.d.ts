import { ListSyncedAddressTokensTransferEVMRData } from './listSyncedAddressTokensTransferEVMRData';
export declare class ListSyncedAddressTokensTransferEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListSyncedAddressTokensTransferEVMRData;
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
