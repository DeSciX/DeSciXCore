import { GetTokenDetailsByContractAddressSolanaRICollection } from './getTokenDetailsByContractAddressSolanaRICollection';
import { GetTokenDetailsByContractAddressSolanaRIFungibleValues } from './getTokenDetailsByContractAddressSolanaRIFungibleValues';
export declare class GetTokenDetailsByContractAddressSolanaRI {
    'collection'?: GetTokenDetailsByContractAddressSolanaRICollection;
    'description'?: string;
    'image'?: string;
    'name'?: string;
    'symbol'?: string;
    'type': GetTokenDetailsByContractAddressSolanaRI.TypeEnum;
    'fungibleValues'?: GetTokenDetailsByContractAddressSolanaRIFungibleValues;
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
export declare namespace GetTokenDetailsByContractAddressSolanaRI {
    enum TypeEnum {
        Fungible,
        NonFungible
    }
}
