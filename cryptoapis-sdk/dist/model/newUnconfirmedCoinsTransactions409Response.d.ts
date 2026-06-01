import { NewUnconfirmedCoinsTransactionsE409 } from './newUnconfirmedCoinsTransactionsE409';
export declare class NewUnconfirmedCoinsTransactions409Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewUnconfirmedCoinsTransactionsE409;
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
