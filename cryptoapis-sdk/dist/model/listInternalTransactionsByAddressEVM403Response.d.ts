import { ListInternalTransactionsByAddressEVME403 } from './listInternalTransactionsByAddressEVME403';
export declare class ListInternalTransactionsByAddressEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListInternalTransactionsByAddressEVME403;
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
