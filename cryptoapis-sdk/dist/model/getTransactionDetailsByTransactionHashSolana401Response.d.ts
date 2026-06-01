import { GetTransactionDetailsByTransactionHashSolanaE401 } from './getTransactionDetailsByTransactionHashSolanaE401';
export declare class GetTransactionDetailsByTransactionHashSolana401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionHashSolanaE401;
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
