import { GetHDWalletXPubYPubZPubDetailsEVME400 } from './getHDWalletXPubYPubZPubDetailsEVME400';
export declare class GetHDWalletXPubYPubZPubDetailsEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetHDWalletXPubYPubZPubDetailsEVME400;
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
