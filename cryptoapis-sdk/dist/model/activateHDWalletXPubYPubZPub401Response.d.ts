import { ActivateHDWalletXPubYPubZPubE401 } from './activateHDWalletXPubYPubZPubE401';
export declare class ActivateHDWalletXPubYPubZPub401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ActivateHDWalletXPubYPubZPubE401;
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
