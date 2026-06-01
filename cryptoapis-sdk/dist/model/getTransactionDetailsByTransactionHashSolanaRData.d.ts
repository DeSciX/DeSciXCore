import { GetTransactionDetailsByTransactionHashSolanaRI } from './getTransactionDetailsByTransactionHashSolanaRI';
export declare class GetTransactionDetailsByTransactionHashSolanaRData {
    'item': GetTransactionDetailsByTransactionHashSolanaRI;
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
