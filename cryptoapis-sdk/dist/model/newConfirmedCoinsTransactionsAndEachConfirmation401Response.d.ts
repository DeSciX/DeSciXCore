import { NewConfirmedCoinsTransactionsAndEachConfirmationE401 } from './newConfirmedCoinsTransactionsAndEachConfirmationE401';
export declare class NewConfirmedCoinsTransactionsAndEachConfirmation401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedCoinsTransactionsAndEachConfirmationE401;
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
