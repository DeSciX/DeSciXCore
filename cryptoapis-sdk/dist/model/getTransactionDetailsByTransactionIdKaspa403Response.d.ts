import { GetTransactionDetailsByTransactionIdKaspaE403 } from './getTransactionDetailsByTransactionIdKaspaE403';
export declare class GetTransactionDetailsByTransactionIdKaspa403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionIdKaspaE403;
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
