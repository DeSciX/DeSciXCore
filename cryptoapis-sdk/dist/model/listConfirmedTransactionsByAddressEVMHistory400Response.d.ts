import { ListConfirmedTransactionsByAddressEVMHistoryE400 } from './listConfirmedTransactionsByAddressEVMHistoryE400';
export declare class ListConfirmedTransactionsByAddressEVMHistory400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressEVMHistoryE400;
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
