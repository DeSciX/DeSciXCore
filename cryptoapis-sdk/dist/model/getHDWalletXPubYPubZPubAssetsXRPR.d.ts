import { GetHDWalletXPubYPubZPubAssetsXRPRData } from './getHDWalletXPubYPubZPubAssetsXRPRData';
export declare class GetHDWalletXPubYPubZPubAssetsXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetHDWalletXPubYPubZPubAssetsXRPRData;
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
