import { ListSupportedAssetsE400 } from './listSupportedAssetsE400';
export declare class ListSupportedAssets400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSupportedAssetsE400;
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
