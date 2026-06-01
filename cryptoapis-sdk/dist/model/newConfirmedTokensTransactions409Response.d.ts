import { NewConfirmedTokensTransactionsE409 } from './newConfirmedTokensTransactionsE409';
export declare class NewConfirmedTokensTransactions409Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedTokensTransactionsE409;
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
