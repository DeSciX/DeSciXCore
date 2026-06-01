import { GetTransactionDetailsByTransactionHashEVME401 } from './getTransactionDetailsByTransactionHashEVME401';
export declare class GetTransactionDetailsByTransactionHashEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionHashEVME401;
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
