import { GetTransactionDetailsByTransactionIdKaspaE401 } from './getTransactionDetailsByTransactionIdKaspaE401';
export declare class GetTransactionDetailsByTransactionIdKaspa401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionIdKaspaE401;
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
