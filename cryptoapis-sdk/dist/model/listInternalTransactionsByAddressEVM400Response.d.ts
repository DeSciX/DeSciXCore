import { ListInternalTransactionsByAddressEVME400 } from './listInternalTransactionsByAddressEVME400';
export declare class ListInternalTransactionsByAddressEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListInternalTransactionsByAddressEVME400;
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
