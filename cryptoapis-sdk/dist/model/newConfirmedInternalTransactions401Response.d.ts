import { NewConfirmedInternalTransactionsE401 } from './newConfirmedInternalTransactionsE401';
export declare class NewConfirmedInternalTransactions401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedInternalTransactionsE401;
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
