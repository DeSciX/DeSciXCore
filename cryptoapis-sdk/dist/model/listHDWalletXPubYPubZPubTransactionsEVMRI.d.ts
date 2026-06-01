import { ListHDWalletXPubYPubZPubTransactionsEVMRIMinedInBlock } from './listHDWalletXPubYPubZPubTransactionsEVMRIMinedInBlock';
import { ListHDWalletXPubYPubZPubTransactionsEVMRIRecipientInner } from './listHDWalletXPubYPubZPubTransactionsEVMRIRecipientInner';
import { ListHDWalletXPubYPubZPubTransactionsEVMRISenderInner } from './listHDWalletXPubYPubZPubTransactionsEVMRISenderInner';
import { ListHDWalletXPubYPubZPubTransactionsUTXORIFee } from './listHDWalletXPubYPubZPubTransactionsUTXORIFee';
export declare class ListHDWalletXPubYPubZPubTransactionsEVMRI {
    'hash': string;
    'positionInBlock': number;
    'recipient': Array<ListHDWalletXPubYPubZPubTransactionsEVMRIRecipientInner>;
    'sender': Array<ListHDWalletXPubYPubZPubTransactionsEVMRISenderInner>;
    'timestamp': number;
    'fee': ListHDWalletXPubYPubZPubTransactionsUTXORIFee;
    'minedInBlock': ListHDWalletXPubYPubZPubTransactionsEVMRIMinedInBlock;
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
