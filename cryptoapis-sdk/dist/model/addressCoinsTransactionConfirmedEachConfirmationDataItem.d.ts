import { AddressCoinsTransactionConfirmedEachConfirmationDataItemMinedInBlock } from './addressCoinsTransactionConfirmedEachConfirmationDataItemMinedInBlock';
export declare class AddressCoinsTransactionConfirmedEachConfirmationDataItem {
    'blockchain': string;
    'network': string;
    'address': string;
    'minedInBlock': AddressCoinsTransactionConfirmedEachConfirmationDataItemMinedInBlock;
    'transactionId': string;
    'currentConfirmations': number;
    'targetConfirmations': number;
    'amount': string;
    'unit': string;
    'direction': AddressCoinsTransactionConfirmedEachConfirmationDataItem.DirectionEnum;
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
export declare namespace AddressCoinsTransactionConfirmedEachConfirmationDataItem {
    enum DirectionEnum {
        Incoming,
        Outgoing
    }
}
