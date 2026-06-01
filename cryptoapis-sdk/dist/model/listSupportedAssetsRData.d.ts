import { ListSupportedAssetsRI } from './listSupportedAssetsRI';
export declare class ListSupportedAssetsRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListSupportedAssetsRI>;
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
