import { NewUnconfirmedCoinsTransactionsRData } from './newUnconfirmedCoinsTransactionsRData';
export declare class NewUnconfirmedCoinsTransactionsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': NewUnconfirmedCoinsTransactionsRData;
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
