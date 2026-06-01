import { ListConfirmedTransactionsByAddressKaspaE401 } from './listConfirmedTransactionsByAddressKaspaE401';
export declare class ListConfirmedTransactionsByAddressKaspa401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressKaspaE401;
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
