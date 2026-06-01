import { GetHDWalletXPubYPubZPubDetailsXRPE400 } from './getHDWalletXPubYPubZPubDetailsXRPE400';
export declare class GetHDWalletXPubYPubZPubDetailsXRP400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetHDWalletXPubYPubZPubDetailsXRPE400;
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
