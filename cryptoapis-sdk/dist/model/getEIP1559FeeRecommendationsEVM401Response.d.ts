import { GetEIP1559FeeRecommendationsEVME401 } from './getEIP1559FeeRecommendationsEVME401';
export declare class GetEIP1559FeeRecommendationsEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetEIP1559FeeRecommendationsEVME401;
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
