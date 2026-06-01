import { AddressTokensTransactionConfirmedData } from './addressTokensTransactionConfirmedData';
export declare class AddressTokensTransactionConfirmed {
    'apiVersion': string;
    'referenceId': string;
    'idempotencyKey': string;
    'data': AddressTokensTransactionConfirmedData;
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
