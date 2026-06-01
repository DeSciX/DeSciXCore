import { NewConfirmedInternalTransactionsAndEachConfirmationE409 } from './newConfirmedInternalTransactionsAndEachConfirmationE409';
export declare class NewConfirmedInternalTransactionsAndEachConfirmation409Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NewConfirmedInternalTransactionsAndEachConfirmationE409;
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
