import { ActivateHDWalletXPubYPubZPubE400 } from './activateHDWalletXPubYPubZPubE400';
export declare class ActivateHDWalletXPubYPubZPub400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ActivateHDWalletXPubYPubZPubE400;
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
