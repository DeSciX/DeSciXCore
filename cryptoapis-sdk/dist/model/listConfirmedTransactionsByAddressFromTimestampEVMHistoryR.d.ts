import { ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData } from './listConfirmedTransactionsByAddressFromTimestampEVMHistoryRData';
export declare class ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData;
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
