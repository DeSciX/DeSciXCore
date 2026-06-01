import { ListTransactionsByAddressSolanaRIFee } from './listTransactionsByAddressSolanaRIFee';
import { ListTransactionsByAddressSolanaRIMinedInBlock } from './listTransactionsByAddressSolanaRIMinedInBlock';
import { ListTransactionsByAddressSolanaRINativeBalanceChangesInner } from './listTransactionsByAddressSolanaRINativeBalanceChangesInner';
import { ListTransactionsByAddressSolanaRINativeMovementsInner } from './listTransactionsByAddressSolanaRINativeMovementsInner';
import { ListTransactionsByAddressSolanaRITokenBalanceChangesInner } from './listTransactionsByAddressSolanaRITokenBalanceChangesInner';
import { ListTransactionsByAddressSolanaRITokenMovementsInner } from './listTransactionsByAddressSolanaRITokenMovementsInner';
export declare class ListTransactionsByAddressSolanaRI {
    'fee': ListTransactionsByAddressSolanaRIFee;
    'nativeBalanceChanges': Array<ListTransactionsByAddressSolanaRINativeBalanceChangesInner>;
    'nativeMovements': Array<ListTransactionsByAddressSolanaRINativeMovementsInner>;
    'signature': string;
    'signer': string;
    'timestamp': number;
    'tokenBalanceChanges': Array<ListTransactionsByAddressSolanaRITokenBalanceChangesInner>;
    'tokenMovements': Array<ListTransactionsByAddressSolanaRITokenMovementsInner>;
    'minedInBlock': ListTransactionsByAddressSolanaRIMinedInBlock;
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
