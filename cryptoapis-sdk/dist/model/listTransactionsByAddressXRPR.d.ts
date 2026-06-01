import { ListTransactionsByAddressXRPRData } from './listTransactionsByAddressXRPRData';
export declare class ListTransactionsByAddressXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListTransactionsByAddressXRPRData;
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
