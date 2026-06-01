import { ListTokensTransfersByTransactionHashEVMRData } from './listTokensTransfersByTransactionHashEVMRData';
export declare class ListTokensTransfersByTransactionHashEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListTokensTransfersByTransactionHashEVMRData;
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
