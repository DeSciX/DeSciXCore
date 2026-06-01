import { GetEIP1559FeeRecommendationsEVME400 } from './getEIP1559FeeRecommendationsEVME400';
export declare class GetEIP1559FeeRecommendationsEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetEIP1559FeeRecommendationsEVME400;
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
