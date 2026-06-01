import { GetBlockDetailsByBlockHashXRPRITotalCoins } from './getBlockDetailsByBlockHashXRPRITotalCoins';
import { GetBlockDetailsByBlockHashXRPRITotalFees } from './getBlockDetailsByBlockHashXRPRITotalFees';
export declare class GetBlockDetailsByBlockHashXRPRI {
    'hash': string;
    'height': number;
    'nextBlockHash': string;
    'previousBlockHash': string;
    'timestamp': number;
    'totalCoins': GetBlockDetailsByBlockHashXRPRITotalCoins;
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
