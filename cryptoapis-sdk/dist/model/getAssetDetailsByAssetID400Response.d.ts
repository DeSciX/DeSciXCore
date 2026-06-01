import { GetAssetDetailsByAssetIDE400 } from './getAssetDetailsByAssetIDE400';
export declare class GetAssetDetailsByAssetID400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAssetDetailsByAssetIDE400;
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
