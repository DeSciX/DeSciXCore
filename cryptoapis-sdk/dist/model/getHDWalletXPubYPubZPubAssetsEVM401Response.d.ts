import { GetHDWalletXPubYPubZPubAssetsEVME401 } from './getHDWalletXPubYPubZPubAssetsEVME401';
export declare class GetHDWalletXPubYPubZPubAssetsEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetHDWalletXPubYPubZPubAssetsEVME401;
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
