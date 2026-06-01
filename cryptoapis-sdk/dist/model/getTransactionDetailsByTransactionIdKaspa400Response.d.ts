import { GetTransactionDetailsByTransactionIdKaspaE400 } from './getTransactionDetailsByTransactionIdKaspaE400';
export declare class GetTransactionDetailsByTransactionIdKaspa400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionIdKaspaE400;
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
