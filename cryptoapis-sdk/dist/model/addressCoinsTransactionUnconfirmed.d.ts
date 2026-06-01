import { AddressCoinsTransactionUnconfirmedData } from './addressCoinsTransactionUnconfirmedData';
export declare class AddressCoinsTransactionUnconfirmed {
    'apiVersion': string;
    'referenceId': string;
    'idempotencyKey': string;
    'data': AddressCoinsTransactionUnconfirmedData;
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
