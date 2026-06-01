import { NewUnconfirmedCoinsTransactionsE400 } from './newUnconfirmedCoinsTransactionsE400';
export declare class NewUnconfirmedCoinsTransactions400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewUnconfirmedCoinsTransactionsE400;
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
