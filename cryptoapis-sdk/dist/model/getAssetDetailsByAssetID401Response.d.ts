import { GetAssetDetailsByAssetIDE401 } from './getAssetDetailsByAssetIDE401';
export declare class GetAssetDetailsByAssetID401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAssetDetailsByAssetIDE401;
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
