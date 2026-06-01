import { ListConfirmedTransactionsByAddressKaspaRData } from './listConfirmedTransactionsByAddressKaspaRData';
export declare class ListConfirmedTransactionsByAddressKaspaR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListConfirmedTransactionsByAddressKaspaRData;
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
