import { ListConfirmedTransactionsByAddressKaspaE400 } from './listConfirmedTransactionsByAddressKaspaE400';
export declare class ListConfirmedTransactionsByAddressKaspa400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressKaspaE400;
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
