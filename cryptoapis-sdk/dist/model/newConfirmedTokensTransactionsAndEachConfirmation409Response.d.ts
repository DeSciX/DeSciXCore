import { NewConfirmedTokensTransactionsAndEachConfirmationE409 } from './newConfirmedTokensTransactionsAndEachConfirmationE409';
export declare class NewConfirmedTokensTransactionsAndEachConfirmation409Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedTokensTransactionsAndEachConfirmationE409;
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
