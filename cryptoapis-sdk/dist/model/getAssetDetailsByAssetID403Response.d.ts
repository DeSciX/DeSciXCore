import { GetAssetDetailsByAssetIDE403 } from './getAssetDetailsByAssetIDE403';
export declare class GetAssetDetailsByAssetID403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAssetDetailsByAssetIDE403;
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
