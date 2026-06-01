import { GetAssetDetailsByAssetSymbolRI } from './getAssetDetailsByAssetSymbolRI';
export declare class GetAssetDetailsByAssetSymbolRData {
    'item': GetAssetDetailsByAssetSymbolRI;
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
