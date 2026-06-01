import { ListInternalTransactionDetailsByTransactionHashEVME401 } from './listInternalTransactionDetailsByTransactionHashEVME401';
export declare class ListInternalTransactionDetailsByTransactionHashEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListInternalTransactionDetailsByTransactionHashEVME401;
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
