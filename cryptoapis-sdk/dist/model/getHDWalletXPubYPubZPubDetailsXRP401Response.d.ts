import { GetHDWalletXPubYPubZPubDetailsXRPE401 } from './getHDWalletXPubYPubZPubDetailsXRPE401';
export declare class GetHDWalletXPubYPubZPubDetailsXRP401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetHDWalletXPubYPubZPubDetailsXRPE401;
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
