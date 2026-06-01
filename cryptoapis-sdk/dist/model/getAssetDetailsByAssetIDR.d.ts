import { GetAssetDetailsByAssetIDRData } from './getAssetDetailsByAssetIDRData';
export declare class GetAssetDetailsByAssetIDR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetAssetDetailsByAssetIDRData;
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
