import { GetAssetDetailsByAssetIDRIContractsInner } from './getAssetDetailsByAssetIDRIContractsInner';
import { GetAssetDetailsByAssetIDRIS } from './getAssetDetailsByAssetIDRIS';
import { ListSupportedAssetsRILatestRate } from './listSupportedAssetsRILatestRate';
import { ListSupportedAssetsRILogo } from './listSupportedAssetsRILogo';
export declare class GetAssetDetailsByAssetIDRI {
    'contracts': Array<GetAssetDetailsByAssetIDRIContractsInner>;
    'latestRate': ListSupportedAssetsRILatestRate;
    'logo': ListSupportedAssetsRILogo;
    'name': string;
    'originalSymbol': string;
    'referenceId': string;
    'slug'?: string;
    'specificData': GetAssetDetailsByAssetIDRIS;
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
