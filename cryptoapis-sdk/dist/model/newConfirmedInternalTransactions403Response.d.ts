import { NewConfirmedInternalTransactionsE403 } from './newConfirmedInternalTransactionsE403';
export declare class NewConfirmedInternalTransactions403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedInternalTransactionsE403;
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
