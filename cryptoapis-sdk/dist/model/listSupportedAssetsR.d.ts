import { ListSupportedAssetsRData } from './listSupportedAssetsRData';
export declare class ListSupportedAssetsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListSupportedAssetsRData;
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
