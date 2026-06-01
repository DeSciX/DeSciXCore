import { ListConfirmedTransactionsByAddressEVMHistoryE403 } from './listConfirmedTransactionsByAddressEVMHistoryE403';
export declare class ListConfirmedTransactionsByAddressEVMHistory403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressEVMHistoryE403;
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
