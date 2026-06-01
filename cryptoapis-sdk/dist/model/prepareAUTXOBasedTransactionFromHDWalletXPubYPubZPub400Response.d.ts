import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubE400 } from './prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubE400';
export declare class PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPub400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubE400;
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
