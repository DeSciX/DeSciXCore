import { ListConfirmedTransactionsByAddressKaspaE403 } from './listConfirmedTransactionsByAddressKaspaE403';
export declare class ListConfirmedTransactionsByAddressKaspa403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressKaspaE403;
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
