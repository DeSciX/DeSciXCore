import { NewConfirmedInternalTransactionsE400 } from './newConfirmedInternalTransactionsE400';
export declare class NewConfirmedInternalTransactions400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedInternalTransactionsE400;
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
