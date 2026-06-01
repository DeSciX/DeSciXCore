import { GetExchangeRateByAssetsIDsE403 } from './getExchangeRateByAssetsIDsE403';
export declare class GetExchangeRateByAssetsIDs403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetExchangeRateByAssetsIDsE403;
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
