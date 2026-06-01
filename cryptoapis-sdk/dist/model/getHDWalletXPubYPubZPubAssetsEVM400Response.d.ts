import { GetHDWalletXPubYPubZPubAssetsEVME400 } from './getHDWalletXPubYPubZPubAssetsEVME400';
export declare class GetHDWalletXPubYPubZPubAssetsEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetHDWalletXPubYPubZPubAssetsEVME400;
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
