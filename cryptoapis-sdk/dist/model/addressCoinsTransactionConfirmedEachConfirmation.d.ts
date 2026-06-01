import { AddressCoinsTransactionConfirmedEachConfirmationData } from './addressCoinsTransactionConfirmedEachConfirmationData';
export declare class AddressCoinsTransactionConfirmedEachConfirmation {
    'apiVersion': string;
    'referenceId': string;
    'idempotencyKey': string;
    'data': AddressCoinsTransactionConfirmedEachConfirmationData;
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
