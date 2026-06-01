import { NewConfirmedCoinsTransactionsE401 } from './newConfirmedCoinsTransactionsE401';
export declare class NewConfirmedCoinsTransactions401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedCoinsTransactionsE401;
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
