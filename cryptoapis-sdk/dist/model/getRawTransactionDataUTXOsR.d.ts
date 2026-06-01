import { GetRawTransactionDataUTXOsRData } from './getRawTransactionDataUTXOsRData';
export declare class GetRawTransactionDataUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetRawTransactionDataUTXOsRData;
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
