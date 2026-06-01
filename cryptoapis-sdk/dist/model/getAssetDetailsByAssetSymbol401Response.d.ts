import { GetAssetDetailsByAssetSymbolE401 } from './getAssetDetailsByAssetSymbolE401';
export declare class GetAssetDetailsByAssetSymbol401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAssetDetailsByAssetSymbolE401;
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
