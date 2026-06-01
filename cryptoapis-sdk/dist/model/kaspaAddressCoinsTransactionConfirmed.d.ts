import { KaspaAddressCoinsTransactionConfirmedData } from './kaspaAddressCoinsTransactionConfirmedData';
export declare class KaspaAddressCoinsTransactionConfirmed {
    'apiVersion': string;
    'referenceId': string;
    'idempotencyKey': string;
    'data': KaspaAddressCoinsTransactionConfirmedData;
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
