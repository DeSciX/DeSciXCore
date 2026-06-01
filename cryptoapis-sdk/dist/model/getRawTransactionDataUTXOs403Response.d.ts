import { GetRawTransactionDataUTXOsE403 } from './getRawTransactionDataUTXOsE403';
export declare class GetRawTransactionDataUTXOs403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetRawTransactionDataUTXOsE403;
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
