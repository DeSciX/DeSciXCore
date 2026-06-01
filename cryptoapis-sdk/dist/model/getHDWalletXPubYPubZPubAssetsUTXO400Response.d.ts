import { GetHDWalletXPubYPubZPubAssetsUTXOE400 } from './getHDWalletXPubYPubZPubAssetsUTXOE400';
export declare class GetHDWalletXPubYPubZPubAssetsUTXO400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetHDWalletXPubYPubZPubAssetsUTXOE400;
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
