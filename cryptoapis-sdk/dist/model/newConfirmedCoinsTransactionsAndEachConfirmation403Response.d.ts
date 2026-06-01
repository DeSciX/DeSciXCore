import { NewConfirmedCoinsTransactionsAndEachConfirmationE403 } from './newConfirmedCoinsTransactionsAndEachConfirmationE403';
export declare class NewConfirmedCoinsTransactionsAndEachConfirmation403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedCoinsTransactionsAndEachConfirmationE403;
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
