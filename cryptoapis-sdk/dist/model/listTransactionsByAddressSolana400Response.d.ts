import { ListTransactionsByAddressSolanaE400 } from './listTransactionsByAddressSolanaE400';
export declare class ListTransactionsByAddressSolana400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTransactionsByAddressSolanaE400;
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
