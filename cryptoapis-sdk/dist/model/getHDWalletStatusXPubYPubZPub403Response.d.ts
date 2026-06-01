import { GetHDWalletStatusXPubYPubZPubE403 } from './getHDWalletStatusXPubYPubZPubE403';
export declare class GetHDWalletStatusXPubYPubZPub403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetHDWalletStatusXPubYPubZPubE403;
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
