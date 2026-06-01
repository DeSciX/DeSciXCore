import { ListTokensTransfersByTransactionHashEVME403 } from './listTokensTransfersByTransactionHashEVME403';
export declare class ListTokensTransfersByTransactionHashEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTokensTransfersByTransactionHashEVME403;
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
