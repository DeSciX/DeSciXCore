import { NewConfirmedCoinsTransactionsAndEachConfirmationRData } from './newConfirmedCoinsTransactionsAndEachConfirmationRData';
export declare class NewConfirmedCoinsTransactionsAndEachConfirmationR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': NewConfirmedCoinsTransactionsAndEachConfirmationRData;
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
