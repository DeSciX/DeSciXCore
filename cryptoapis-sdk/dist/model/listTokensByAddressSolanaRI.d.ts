import { ListTokensByAddressSolanaRIFungibleValues } from './listTokensByAddressSolanaRIFungibleValues';
export declare class ListTokensByAddressSolanaRI {
    'contractAddress': string;
    'name'?: string;
    'symbol'?: string;
    'tokenAddress': string;
    'type': ListTokensByAddressSolanaRI.TypeEnum;
    'fungibleValues': ListTokensByAddressSolanaRIFungibleValues;
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
export declare namespace ListTokensByAddressSolanaRI {
    enum TypeEnum {
        NonFungible,
        Fungible
    }
}
