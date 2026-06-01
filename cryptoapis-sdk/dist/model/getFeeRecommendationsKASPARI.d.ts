import { GetFeeRecommendationsKASPARIFeePerGram } from './getFeeRecommendationsKASPARIFeePerGram';
import { GetFeeRecommendationsKASPARITimeForMining } from './getFeeRecommendationsKASPARITimeForMining';
export declare class GetFeeRecommendationsKASPARI {
    'feePerGram': GetFeeRecommendationsKASPARIFeePerGram;
    'timeForMining': GetFeeRecommendationsKASPARITimeForMining;
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
