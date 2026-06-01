import { ListConfirmedTransactionsByAddressEVMHistoryE401 } from './listConfirmedTransactionsByAddressEVMHistoryE401';
export declare class ListConfirmedTransactionsByAddressEVMHistory401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressEVMHistoryE401;
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
