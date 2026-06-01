import { NewConfirmedInternalTransactionsRData } from './newConfirmedInternalTransactionsRData';
export declare class NewConfirmedInternalTransactionsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': NewConfirmedInternalTransactionsRData;
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
