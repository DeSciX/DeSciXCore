import { ListInternalTransactionsByAddressEVMRData } from './listInternalTransactionsByAddressEVMRData';
export declare class ListInternalTransactionsByAddressEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListInternalTransactionsByAddressEVMRData;
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
