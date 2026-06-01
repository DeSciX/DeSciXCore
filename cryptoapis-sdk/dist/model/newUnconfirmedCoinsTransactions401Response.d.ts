import { NewUnconfirmedCoinsTransactionsE401 } from './newUnconfirmedCoinsTransactionsE401';
export declare class NewUnconfirmedCoinsTransactions401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewUnconfirmedCoinsTransactionsE401;
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
