import { ListHDWalletXPubYPubZPubTransactionsUTXORIMinedInBlock } from './listHDWalletXPubYPubZPubTransactionsUTXORIMinedInBlock';
import { ListHDWalletXPubYPubZPubTransactionsUTXORISendersInner } from './listHDWalletXPubYPubZPubTransactionsUTXORISendersInner';
import { ListHDWalletXPubYPubZPubTransactionsXRPRIFee } from './listHDWalletXPubYPubZPubTransactionsXRPRIFee';
import { ListHDWalletXPubYPubZPubTransactionsXRPRIRecipientInner } from './listHDWalletXPubYPubZPubTransactionsXRPRIRecipientInner';
export declare class ListHDWalletXPubYPubZPubTransactionsXRPRI {
    'hash': string;
    'positionInBlock': number;
    'recipient': Array<ListHDWalletXPubYPubZPubTransactionsXRPRIRecipientInner>;
    'sender': Array<ListHDWalletXPubYPubZPubTransactionsUTXORISendersInner>;
    'timestamp': number;
    'fee': ListHDWalletXPubYPubZPubTransactionsXRPRIFee;
    'minedInBlock': ListHDWalletXPubYPubZPubTransactionsUTXORIMinedInBlock;
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
