import { KaspaAddressCoinsTransactionConfirmedDataItemMinedInBlock } from './kaspaAddressCoinsTransactionConfirmedDataItemMinedInBlock';
export declare class KaspaAddressCoinsTransactionConfirmedDataItem {
    'blockchain': string;
    'network': string;
    'address': string;
    'minedInBlock': KaspaAddressCoinsTransactionConfirmedDataItemMinedInBlock;
    'transactionId': string;
    'amount': string;
    'unit': string;
    'direction': KaspaAddressCoinsTransactionConfirmedDataItem.DirectionEnum;
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
export declare namespace KaspaAddressCoinsTransactionConfirmedDataItem {
    enum DirectionEnum {
        Incoming,
        Outgoing
    }
}
