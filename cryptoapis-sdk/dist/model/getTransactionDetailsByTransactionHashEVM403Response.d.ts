import { GetTransactionDetailsByTransactionHashEVME403 } from './getTransactionDetailsByTransactionHashEVME403';
export declare class GetTransactionDetailsByTransactionHashEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionHashEVME403;
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
