import { NewConfirmedCoinsTransactionsE409 } from './newConfirmedCoinsTransactionsE409';
export declare class NewConfirmedCoinsTransactions409Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedCoinsTransactionsE409;
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
