import { GetLatestMinedBlockXRPRITotalCoins } from './getLatestMinedBlockXRPRITotalCoins';
import { GetLatestMinedBlockXRPRITotalFees } from './getLatestMinedBlockXRPRITotalFees';
export declare class GetLatestMinedBlockXRPRI {
    'hash': string;
    'height': number;
    'previousBlockHash': string;
    'timestamp': number;
    'transactionsCount': number;
    'totalCoins': GetLatestMinedBlockXRPRITotalCoins;
    'totalFees': GetLatestMinedBlockXRPRITotalFees;
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
