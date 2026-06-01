import { GetTransactionDetailsByTransactionHashSolanaE403 } from './getTransactionDetailsByTransactionHashSolanaE403';
export declare class GetTransactionDetailsByTransactionHashSolana403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionHashSolanaE403;
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
