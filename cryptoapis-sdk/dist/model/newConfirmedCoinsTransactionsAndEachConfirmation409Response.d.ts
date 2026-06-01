import { NewConfirmedCoinsTransactionsAndEachConfirmationE409 } from './newConfirmedCoinsTransactionsAndEachConfirmationE409';
export declare class NewConfirmedCoinsTransactionsAndEachConfirmation409Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedCoinsTransactionsAndEachConfirmationE409;
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
