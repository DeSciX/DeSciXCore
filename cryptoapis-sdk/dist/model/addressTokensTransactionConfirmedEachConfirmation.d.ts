import { AddressTokensTransactionConfirmedEachConfirmationData } from './addressTokensTransactionConfirmedEachConfirmationData';
export declare class AddressTokensTransactionConfirmedEachConfirmation {
    'apiVersion': string;
    'referenceId': string;
    'idempotencyKey': string;
    'data': AddressTokensTransactionConfirmedEachConfirmationData;
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
