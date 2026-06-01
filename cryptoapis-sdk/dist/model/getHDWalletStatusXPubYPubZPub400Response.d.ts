import { GetHDWalletStatusXPubYPubZPubE400 } from './getHDWalletStatusXPubYPubZPubE400';
export declare class GetHDWalletStatusXPubYPubZPub400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetHDWalletStatusXPubYPubZPubE400;
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
