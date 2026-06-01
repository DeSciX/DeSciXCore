import { ListHDWalletXPubYPubZPubTransactionsUTXORIFee } from './listHDWalletXPubYPubZPubTransactionsUTXORIFee';
import { ListHDWalletXPubYPubZPubTransactionsUTXORIMinedInBlock } from './listHDWalletXPubYPubZPubTransactionsUTXORIMinedInBlock';
import { ListHDWalletXPubYPubZPubTransactionsUTXORIRecipientsInner } from './listHDWalletXPubYPubZPubTransactionsUTXORIRecipientsInner';
import { ListHDWalletXPubYPubZPubTransactionsUTXORISendersInner } from './listHDWalletXPubYPubZPubTransactionsUTXORISendersInner';
export declare class ListHDWalletXPubYPubZPubTransactionsUTXORI {
    'hash': string;
    'id': string;
    'positionInBlock': number;
    'recipients': Array<ListHDWalletXPubYPubZPubTransactionsUTXORIRecipientsInner>;
    'senders': Array<ListHDWalletXPubYPubZPubTransactionsUTXORISendersInner>;
    'timestamp': number;
    'fee': ListHDWalletXPubYPubZPubTransactionsUTXORIFee;
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
