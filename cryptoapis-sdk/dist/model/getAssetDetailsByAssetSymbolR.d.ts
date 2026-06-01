import { GetAssetDetailsByAssetSymbolRData } from './getAssetDetailsByAssetSymbolRData';
export declare class GetAssetDetailsByAssetSymbolR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetAssetDetailsByAssetSymbolRData;
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
