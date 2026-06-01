import { AddressCoinsTransactionConfirmedData } from './addressCoinsTransactionConfirmedData';
export declare class AddressCoinsTransactionConfirmed {
    'apiVersion': string;
    'referenceId': string;
    'idempotencyKey': string;
    'data': AddressCoinsTransactionConfirmedData;
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
