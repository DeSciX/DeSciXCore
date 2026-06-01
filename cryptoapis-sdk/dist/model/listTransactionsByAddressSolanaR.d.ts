import { ListTransactionsByAddressSolanaRData } from './listTransactionsByAddressSolanaRData';
export declare class ListTransactionsByAddressSolanaR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListTransactionsByAddressSolanaRData;
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
