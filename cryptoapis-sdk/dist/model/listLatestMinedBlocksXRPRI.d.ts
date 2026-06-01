import { ListLatestMinedBlocksXRPRITotalCoins } from './listLatestMinedBlocksXRPRITotalCoins';
import { ListLatestMinedBlocksXRPRITotalFees } from './listLatestMinedBlocksXRPRITotalFees';
export declare class ListLatestMinedBlocksXRPRI {
    'hash': string;
    'height': number;
    'previousBlockHash': string;
    'timestamp': number;
    'totalFees': ListLatestMinedBlocksXRPRITotalFees;
    'transactionsCount': number;
    'totalCoins': ListLatestMinedBlocksXRPRITotalCoins;
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
