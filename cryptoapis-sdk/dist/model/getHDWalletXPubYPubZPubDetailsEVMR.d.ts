import { GetHDWalletXPubYPubZPubDetailsEVMRData } from './getHDWalletXPubYPubZPubDetailsEVMRData';
export declare class GetHDWalletXPubYPubZPubDetailsEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetHDWalletXPubYPubZPubDetailsEVMRData;
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
