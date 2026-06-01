import { NewConfirmedTokensTransactionsRData } from './newConfirmedTokensTransactionsRData';
export declare class NewConfirmedTokensTransactionsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': NewConfirmedTokensTransactionsRData;
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
