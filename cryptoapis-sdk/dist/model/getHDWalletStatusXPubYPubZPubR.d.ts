import { GetHDWalletStatusXPubYPubZPubRData } from './getHDWalletStatusXPubYPubZPubRData';
export declare class GetHDWalletStatusXPubYPubZPubR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetHDWalletStatusXPubYPubZPubRData;
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
