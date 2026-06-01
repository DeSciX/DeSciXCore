import { ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401 } from './listConfirmedTransactionsByAddressFromTimestampEVMHistoryE401';
export declare class ListConfirmedTransactionsByAddressFromTimestampEVMHistory401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401;
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
