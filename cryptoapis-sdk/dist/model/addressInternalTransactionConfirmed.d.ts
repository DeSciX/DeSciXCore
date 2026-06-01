import { AddressInternalTransactionConfirmedData } from './addressInternalTransactionConfirmedData';
export declare class AddressInternalTransactionConfirmed {
    'apiVersion': string;
    'referenceId': string;
    'idempotencyKey': string;
    'data': AddressInternalTransactionConfirmedData;
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
