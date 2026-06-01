import { ListConfirmedTransactionsByAddressEVMHistoryRData } from './listConfirmedTransactionsByAddressEVMHistoryRData';
export declare class ListConfirmedTransactionsByAddressEVMHistoryR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListConfirmedTransactionsByAddressEVMHistoryRData;
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
