import { NewConfirmedTokensTransactionsAndEachConfirmationE401 } from './newConfirmedTokensTransactionsAndEachConfirmationE401';
export declare class NewConfirmedTokensTransactionsAndEachConfirmation401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedTokensTransactionsAndEachConfirmationE401;
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
