import { ListTransactionsByAddressSolanaE401 } from './listTransactionsByAddressSolanaE401';
export declare class ListTransactionsByAddressSolana401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTransactionsByAddressSolanaE401;
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
