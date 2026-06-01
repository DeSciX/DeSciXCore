import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubE401 } from './prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubE401';
export declare class PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPub401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubE401;
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
