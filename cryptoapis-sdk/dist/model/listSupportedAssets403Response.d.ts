import { ListSupportedAssetsE403 } from './listSupportedAssetsE403';
export declare class ListSupportedAssets403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSupportedAssetsE403;
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
