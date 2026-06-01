import { GetTransactionDetailsByTransactionHashSolanaRIFee } from './getTransactionDetailsByTransactionHashSolanaRIFee';
import { GetTransactionDetailsByTransactionHashSolanaRINativeBalanceChangesInner } from './getTransactionDetailsByTransactionHashSolanaRINativeBalanceChangesInner';
import { GetTransactionDetailsByTransactionHashSolanaRITokenBalanceChangesInner } from './getTransactionDetailsByTransactionHashSolanaRITokenBalanceChangesInner';
import { GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner } from './getTransactionDetailsByTransactionHashSolanaRITokenMovementsInner';
import { ListTransactionsByAddressSolanaRIMinedInBlock } from './listTransactionsByAddressSolanaRIMinedInBlock';
import { ListTransactionsByAddressSolanaRINativeMovementsInner } from './listTransactionsByAddressSolanaRINativeMovementsInner';
export declare class GetTransactionDetailsByTransactionHashSolanaRI {
    'fee': GetTransactionDetailsByTransactionHashSolanaRIFee;
    'nativeBalanceChanges': Array<GetTransactionDetailsByTransactionHashSolanaRINativeBalanceChangesInner>;
    'nativeMovements': Array<ListTransactionsByAddressSolanaRINativeMovementsInner>;
    'signature': string;
    'signer': string;
    'timestamp': number;
    'tokenBalanceChanges': Array<GetTransactionDetailsByTransactionHashSolanaRITokenBalanceChangesInner>;
    'tokenMovements': Array<GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner>;
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
