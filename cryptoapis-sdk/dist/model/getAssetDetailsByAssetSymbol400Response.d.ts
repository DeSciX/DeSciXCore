import { GetAssetDetailsByAssetSymbolE400 } from './getAssetDetailsByAssetSymbolE400';
export declare class GetAssetDetailsByAssetSymbol400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAssetDetailsByAssetSymbolE400;
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
