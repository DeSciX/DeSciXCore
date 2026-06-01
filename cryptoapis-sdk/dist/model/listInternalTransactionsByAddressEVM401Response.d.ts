import { ListInternalTransactionsByAddressEVME401 } from './listInternalTransactionsByAddressEVME401';
export declare class ListInternalTransactionsByAddressEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListInternalTransactionsByAddressEVME401;
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
