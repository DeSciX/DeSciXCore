import { NewConfirmedCoinsTransactionsRData } from './newConfirmedCoinsTransactionsRData';
export declare class NewConfirmedCoinsTransactionsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': NewConfirmedCoinsTransactionsRData;
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
