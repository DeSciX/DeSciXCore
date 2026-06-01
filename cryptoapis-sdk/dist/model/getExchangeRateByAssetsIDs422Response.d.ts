import { GetExchangeRateByAssetsIDsE422 } from './getExchangeRateByAssetsIDsE422';
export declare class GetExchangeRateByAssetsIDs422Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetExchangeRateByAssetsIDsE422;
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
