import { ListTokensTransfersByTransactionHashEVMRI } from './listTokensTransfersByTransactionHashEVMRI';
export declare class ListTokensTransfersByTransactionHashEVMRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListTokensTransfersByTransactionHashEVMRI>;
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
