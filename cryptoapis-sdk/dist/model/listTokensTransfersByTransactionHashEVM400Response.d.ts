import { ListTokensTransfersByTransactionHashEVME400 } from './listTokensTransfersByTransactionHashEVME400';
export declare class ListTokensTransfersByTransactionHashEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTokensTransfersByTransactionHashEVME400;
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
