import { ListConfirmedTransactionsByAddressEVME401 } from './listConfirmedTransactionsByAddressEVME401';
export declare class ListConfirmedTransactionsByAddressEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressEVME401;
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
