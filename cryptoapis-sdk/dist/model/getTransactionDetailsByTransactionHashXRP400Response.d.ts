import { GetTransactionDetailsByTransactionHashXRPE400 } from './getTransactionDetailsByTransactionHashXRPE400';
export declare class GetTransactionDetailsByTransactionHashXRP400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionHashXRPE400;
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
