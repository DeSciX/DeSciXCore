import { NewConfirmedTokensTransactionsAndEachConfirmationE400 } from './newConfirmedTokensTransactionsAndEachConfirmationE400';
export declare class NewConfirmedTokensTransactionsAndEachConfirmation400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedTokensTransactionsAndEachConfirmationE400;
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
