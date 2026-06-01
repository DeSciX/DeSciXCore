export declare class ListSupportedAssetsRISC {
    '_1hourPriceChangeInPercentage': string;
    '_1weekPriceChangeInPercentage': string;
    '_24hoursPriceChangeInPercentage': string;
    '_24hoursTradingVolume': string;
    'circulatingSupply': string;
    'marketCapInUSD': string;
    'maxSupply': string;
    'type': ListSupportedAssetsRISC.TypeEnum;
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
export declare namespace ListSupportedAssetsRISC {
    enum TypeEnum {
        Coin,
        Token
    }
}
