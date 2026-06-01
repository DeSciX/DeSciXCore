import { GetAssetDetailsByAssetIDRIContractsInnerFungibleValues } from './getAssetDetailsByAssetIDRIContractsInnerFungibleValues';
export declare class GetAssetDetailsByAssetIDRIContractsInner {
    'blockchain': string;
    'fungibleValues'?: GetAssetDetailsByAssetIDRIContractsInnerFungibleValues;
    'identifier': string;
    'network': string;
    'standard': string;
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
