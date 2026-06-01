import { NewConfirmedInternalTransactionsAndEachConfirmationE403 } from './newConfirmedInternalTransactionsAndEachConfirmationE403';
export declare class NewConfirmedInternalTransactionsAndEachConfirmation403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedInternalTransactionsAndEachConfirmationE403;
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
