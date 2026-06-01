import { GetHDWalletStatusXPubYPubZPubE401 } from './getHDWalletStatusXPubYPubZPubE401';
export declare class GetHDWalletStatusXPubYPubZPub401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetHDWalletStatusXPubYPubZPubE401;
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
