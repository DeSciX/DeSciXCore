import { ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400 } from './listConfirmedTransactionsByAddressFromTimestampEVMHistoryE400';
export declare class ListConfirmedTransactionsByAddressFromTimestampEVMHistory400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400;
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
