import { GetHDWalletXPubYPubZPubAssetsUTXOE401 } from './getHDWalletXPubYPubZPubAssetsUTXOE401';
export declare class GetHDWalletXPubYPubZPubAssetsUTXO401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetHDWalletXPubYPubZPubAssetsUTXOE401;
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
