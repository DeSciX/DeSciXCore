import { ListSupportedAssetsE401 } from './listSupportedAssetsE401';
export declare class ListSupportedAssets401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSupportedAssetsE401;
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
