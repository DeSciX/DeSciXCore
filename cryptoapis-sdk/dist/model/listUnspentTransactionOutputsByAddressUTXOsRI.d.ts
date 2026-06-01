import { ListUnspentTransactionOutputsByAddressUTXOsRIValue } from './listUnspentTransactionOutputsByAddressUTXOsRIValue';
export declare class ListUnspentTransactionOutputsByAddressUTXOsRI {
    'address': string;
    'index': number;
    'isAvailable': boolean;
    'isConfirmed': boolean;
    'timestamp': number;
    'transactionId': string;
    'value': ListUnspentTransactionOutputsByAddressUTXOsRIValue;
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
