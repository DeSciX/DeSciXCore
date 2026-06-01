import { GetBlockDetailsByBlockHashXRPRITotalFees } from './getBlockDetailsByBlockHashXRPRITotalFees';
import { GetBlockDetailsByBlockHeightXRPRITotalCoins } from './getBlockDetailsByBlockHeightXRPRITotalCoins';
export declare class GetBlockDetailsByBlockHeightXRPRI {
    'hash': string;
    'height': number;
    'nextBlockHash': string;
    'previousBlockHash': string;
    'timestamp': number;
    'totalCoins': GetBlockDetailsByBlockHeightXRPRITotalCoins;
    'totalFees': GetBlockDetailsByBlockHashXRPRITotalFees;
    'transactionsCount': number;
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
