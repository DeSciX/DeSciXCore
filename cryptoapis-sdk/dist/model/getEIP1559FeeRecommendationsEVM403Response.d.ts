import { GetEIP1559FeeRecommendationsEVME403 } from './getEIP1559FeeRecommendationsEVME403';
export declare class GetEIP1559FeeRecommendationsEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetEIP1559FeeRecommendationsEVME403;
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
