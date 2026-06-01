import { ListTokensTransfersByTransactionHashEVME401 } from './listTokensTransfersByTransactionHashEVME401';
export declare class ListTokensTransfersByTransactionHashEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTokensTransfersByTransactionHashEVME401;
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
