import { GetExchangeRateByAssetsIDsRData } from './getExchangeRateByAssetsIDsRData';
export declare class GetExchangeRateByAssetsIDsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetExchangeRateByAssetsIDsRData;
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
