import { GetHDWalletXPubYPubZPubDetailsUTXOE401 } from './getHDWalletXPubYPubZPubDetailsUTXOE401';
export declare class GetHDWalletXPubYPubZPubDetailsUTXO401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetHDWalletXPubYPubZPubDetailsUTXOE401;
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
