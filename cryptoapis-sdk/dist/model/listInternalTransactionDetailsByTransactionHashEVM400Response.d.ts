import { ListInternalTransactionDetailsByTransactionHashEVME400 } from './listInternalTransactionDetailsByTransactionHashEVME400';
export declare class ListInternalTransactionDetailsByTransactionHashEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListInternalTransactionDetailsByTransactionHashEVME400;
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
