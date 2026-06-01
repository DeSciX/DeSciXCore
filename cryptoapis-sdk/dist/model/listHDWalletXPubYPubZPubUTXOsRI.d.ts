import { ListHDWalletXPubYPubZPubUTXOsRIValue } from './listHDWalletXPubYPubZPubUTXOsRIValue';
export declare class ListHDWalletXPubYPubZPubUTXOsRI {
    'address': string;
    'addressPath': string;
    'derivation': string;
    'index': number;
    'isAvailable': boolean;
    'isConfirmed': boolean;
    'transactionId': string;
    'value': ListHDWalletXPubYPubZPubUTXOsRIValue;
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
