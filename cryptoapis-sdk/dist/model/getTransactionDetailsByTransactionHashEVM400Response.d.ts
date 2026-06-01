import { GetTransactionDetailsByTransactionHashEVME400 } from './getTransactionDetailsByTransactionHashEVME400';
export declare class GetTransactionDetailsByTransactionHashEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionHashEVME400;
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
