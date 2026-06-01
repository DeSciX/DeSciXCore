import { GetRawTransactionDataUTXOsE400 } from './getRawTransactionDataUTXOsE400';
export declare class GetRawTransactionDataUTXOs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetRawTransactionDataUTXOsE400;
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
