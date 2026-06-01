import { GetHDWalletXPubYPubZPubDetailsUTXOE400 } from './getHDWalletXPubYPubZPubDetailsUTXOE400';
export declare class GetHDWalletXPubYPubZPubDetailsUTXO400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetHDWalletXPubYPubZPubDetailsUTXOE400;
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
