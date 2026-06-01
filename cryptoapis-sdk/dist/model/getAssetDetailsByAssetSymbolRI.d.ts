import { GetAssetDetailsByAssetIDRIContractsInner } from './getAssetDetailsByAssetIDRIContractsInner';
import { GetAssetDetailsByAssetSymbolRIS } from './getAssetDetailsByAssetSymbolRIS';
import { ListSupportedAssetsRILatestRate } from './listSupportedAssetsRILatestRate';
import { ListSupportedAssetsRILogo } from './listSupportedAssetsRILogo';
export declare class GetAssetDetailsByAssetSymbolRI {
    'contracts': Array<GetAssetDetailsByAssetIDRIContractsInner>;
    'latestRate': ListSupportedAssetsRILatestRate;
    'logo': ListSupportedAssetsRILogo;
    'name': string;
    'originalSymbol': string;
    'referenceId': string;
    'slug'?: string;
    'specificData': GetAssetDetailsByAssetSymbolRIS;
    'symbol': string;
    'type': GetAssetDetailsByAssetSymbolRI.TypeEnum;
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
export declare namespace GetAssetDetailsByAssetSymbolRI {
    enum TypeEnum {
        Fiat,
        Crypto
    }
}
