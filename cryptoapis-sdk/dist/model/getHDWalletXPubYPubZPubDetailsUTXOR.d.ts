import { GetHDWalletXPubYPubZPubDetailsUTXORData } from './getHDWalletXPubYPubZPubDetailsUTXORData';
export declare class GetHDWalletXPubYPubZPubDetailsUTXOR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetHDWalletXPubYPubZPubDetailsUTXORData;
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
