import { NewConfirmedTokensTransactionsE401 } from './newConfirmedTokensTransactionsE401';
export declare class NewConfirmedTokensTransactions401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedTokensTransactionsE401;
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
