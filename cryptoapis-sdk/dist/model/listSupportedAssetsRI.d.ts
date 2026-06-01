import { ListSupportedAssetsRILatestRate } from './listSupportedAssetsRILatestRate';
import { ListSupportedAssetsRILogo } from './listSupportedAssetsRILogo';
import { ListSupportedAssetsRIS } from './listSupportedAssetsRIS';
export declare class ListSupportedAssetsRI {
    'latestRate': ListSupportedAssetsRILatestRate;
    'logo': ListSupportedAssetsRILogo;
    'name': string;
    'originalSymbol': string;
    'referenceId': string;
    'slug'?: string;
    'specificData': ListSupportedAssetsRIS;
    'symbol': string;
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
