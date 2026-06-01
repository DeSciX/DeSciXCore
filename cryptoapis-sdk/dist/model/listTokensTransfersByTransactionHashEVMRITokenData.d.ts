import { ListTokensTransfersByTransactionHashEVMRITokenDataFungibleValues } from './listTokensTransfersByTransactionHashEVMRITokenDataFungibleValues';
import { ListTokensTransfersByTransactionHashEVMRITokenDataNonFungibleValues } from './listTokensTransfersByTransactionHashEVMRITokenDataNonFungibleValues';
export declare class ListTokensTransfersByTransactionHashEVMRITokenData {
    'name'?: string;
    'nonFungibleValues'?: ListTokensTransfersByTransactionHashEVMRITokenDataNonFungibleValues;
    'symbol'?: string;
    'contractAddress': string;
    'fungibleValues': ListTokensTransfersByTransactionHashEVMRITokenDataFungibleValues;
    'standard': string;
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
