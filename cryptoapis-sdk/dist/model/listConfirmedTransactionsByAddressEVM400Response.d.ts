import { ListConfirmedTransactionsByAddressEVME400 } from './listConfirmedTransactionsByAddressEVME400';
export declare class ListConfirmedTransactionsByAddressEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressEVME400;
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
