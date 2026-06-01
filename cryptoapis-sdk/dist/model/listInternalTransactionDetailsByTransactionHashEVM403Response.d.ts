import { ListInternalTransactionDetailsByTransactionHashEVME403 } from './listInternalTransactionDetailsByTransactionHashEVME403';
export declare class ListInternalTransactionDetailsByTransactionHashEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListInternalTransactionDetailsByTransactionHashEVME403;
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
