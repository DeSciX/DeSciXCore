import { GetHDWalletXPubYPubZPubAssetsUTXORData } from './getHDWalletXPubYPubZPubAssetsUTXORData';
export declare class GetHDWalletXPubYPubZPubAssetsUTXOR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetHDWalletXPubYPubZPubAssetsUTXORData;
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
