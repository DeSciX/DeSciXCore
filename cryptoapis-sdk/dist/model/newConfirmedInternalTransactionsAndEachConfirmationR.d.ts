import { NewConfirmedInternalTransactionsAndEachConfirmationRData } from './newConfirmedInternalTransactionsAndEachConfirmationRData';
export declare class NewConfirmedInternalTransactionsAndEachConfirmationR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': NewConfirmedInternalTransactionsAndEachConfirmationRData;
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
