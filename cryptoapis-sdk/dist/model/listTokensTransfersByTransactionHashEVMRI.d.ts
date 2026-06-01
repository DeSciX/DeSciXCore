import { ListTokensTransfersByTransactionHashEVMRIFee } from './listTokensTransfersByTransactionHashEVMRIFee';
import { ListTokensTransfersByTransactionHashEVMRITokenData } from './listTokensTransfersByTransactionHashEVMRITokenData';
export declare class ListTokensTransfersByTransactionHashEVMRI {
    'recipient': string;
    'sender': string;
    'tokenData': ListTokensTransfersByTransactionHashEVMRITokenData;
    'fee': ListTokensTransfersByTransactionHashEVMRIFee;
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
