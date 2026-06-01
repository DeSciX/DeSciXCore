import { NewConfirmedTokensTransactionsAndEachConfirmationRData } from './newConfirmedTokensTransactionsAndEachConfirmationRData';
export declare class NewConfirmedTokensTransactionsAndEachConfirmationR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': NewConfirmedTokensTransactionsAndEachConfirmationRData;
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
