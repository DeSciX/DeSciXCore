import { BlockchainDataTransactionNotFound } from './blockchainDataTransactionNotFound';
export declare class GetTransactionDetailsByTransactionHashSolana404Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': BlockchainDataTransactionNotFound;
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
