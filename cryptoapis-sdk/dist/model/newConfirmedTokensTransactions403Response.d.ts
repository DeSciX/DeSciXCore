import { NewConfirmedTokensTransactionsE403 } from './newConfirmedTokensTransactionsE403';
export declare class NewConfirmedTokensTransactions403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedTokensTransactionsE403;
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
