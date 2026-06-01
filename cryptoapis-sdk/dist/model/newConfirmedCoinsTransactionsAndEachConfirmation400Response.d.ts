import { NewConfirmedCoinsTransactionsAndEachConfirmationE400 } from './newConfirmedCoinsTransactionsAndEachConfirmationE400';
export declare class NewConfirmedCoinsTransactionsAndEachConfirmation400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedCoinsTransactionsAndEachConfirmationE400;
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
