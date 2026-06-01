import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRData } from './prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRData';
export declare class PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRData;
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
