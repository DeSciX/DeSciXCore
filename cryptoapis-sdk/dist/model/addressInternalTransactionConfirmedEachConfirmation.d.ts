import { AddressInternalTransactionConfirmedEachConfirmationData } from './addressInternalTransactionConfirmedEachConfirmationData';
export declare class AddressInternalTransactionConfirmedEachConfirmation {
    'apiVersion': string;
    'referenceId': string;
    'idempotencyKey': string;
    'data': AddressInternalTransactionConfirmedEachConfirmationData;
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
