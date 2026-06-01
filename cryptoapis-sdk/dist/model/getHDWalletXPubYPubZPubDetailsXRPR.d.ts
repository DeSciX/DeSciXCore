import { GetHDWalletXPubYPubZPubDetailsXRPRData } from './getHDWalletXPubYPubZPubDetailsXRPRData';
export declare class GetHDWalletXPubYPubZPubDetailsXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetHDWalletXPubYPubZPubDetailsXRPRData;
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
