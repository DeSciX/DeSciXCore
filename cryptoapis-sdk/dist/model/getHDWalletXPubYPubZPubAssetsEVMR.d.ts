import { GetHDWalletXPubYPubZPubAssetsEVMRData } from './getHDWalletXPubYPubZPubAssetsEVMRData';
export declare class GetHDWalletXPubYPubZPubAssetsEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetHDWalletXPubYPubZPubAssetsEVMRData;
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
