import { NewConfirmedInternalTransactionsAndEachConfirmationE400 } from './newConfirmedInternalTransactionsAndEachConfirmationE400';
export declare class NewConfirmedInternalTransactionsAndEachConfirmation400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedInternalTransactionsAndEachConfirmationE400;
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
