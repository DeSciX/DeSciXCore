import { GetTransactionDetailsByTransactionHashSolanaE400 } from './getTransactionDetailsByTransactionHashSolanaE400';
export declare class GetTransactionDetailsByTransactionHashSolana400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionHashSolanaE400;
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
