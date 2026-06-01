import { GetExchangeRateByAssetsIDsE400 } from './getExchangeRateByAssetsIDsE400';
export declare class GetExchangeRateByAssetsIDs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetExchangeRateByAssetsIDsE400;
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
