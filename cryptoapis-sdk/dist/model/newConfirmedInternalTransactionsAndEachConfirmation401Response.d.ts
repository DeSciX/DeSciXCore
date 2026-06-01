import { NewConfirmedInternalTransactionsAndEachConfirmationE401 } from './newConfirmedInternalTransactionsAndEachConfirmationE401';
export declare class NewConfirmedInternalTransactionsAndEachConfirmation401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedInternalTransactionsAndEachConfirmationE401;
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
