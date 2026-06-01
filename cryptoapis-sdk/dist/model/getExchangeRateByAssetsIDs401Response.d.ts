import { GetExchangeRateByAssetsIDsE401 } from './getExchangeRateByAssetsIDsE401';
export declare class GetExchangeRateByAssetsIDs401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetExchangeRateByAssetsIDsE401;
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
