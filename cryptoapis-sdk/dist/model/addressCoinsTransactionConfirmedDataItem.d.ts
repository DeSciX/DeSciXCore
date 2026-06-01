import { AddressCoinsTransactionConfirmedDataItemMinedInBlock } from './addressCoinsTransactionConfirmedDataItemMinedInBlock';
export declare class AddressCoinsTransactionConfirmedDataItem {
    'blockchain': string;
    'network': string;
    'address': string;
    'minedInBlock': AddressCoinsTransactionConfirmedDataItemMinedInBlock;
    'transactionId': string;
    'amount': string;
    'unit': string;
    'direction': AddressCoinsTransactionConfirmedDataItem.DirectionEnum;
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
export declare namespace AddressCoinsTransactionConfirmedDataItem {
    enum DirectionEnum {
        Incoming,
        Outgoing
    }
}
