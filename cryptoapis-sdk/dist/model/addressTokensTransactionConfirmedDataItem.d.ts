import { AddressTokensTransactionConfirmedDataItemMinedInBlock } from './addressTokensTransactionConfirmedDataItemMinedInBlock';
import { AddressTokensTransactionConfirmedToken } from './addressTokensTransactionConfirmedToken';
export declare class AddressTokensTransactionConfirmedDataItem {
    'blockchain': string;
    'network': string;
    'address': string;
    'minedInBlock': AddressTokensTransactionConfirmedDataItemMinedInBlock;
    'transactionId': string;
    'tokenType': AddressTokensTransactionConfirmedDataItem.TokenTypeEnum;
    'token': AddressTokensTransactionConfirmedToken;
    'direction': AddressTokensTransactionConfirmedDataItem.DirectionEnum;
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
export declare namespace AddressTokensTransactionConfirmedDataItem {
    enum TokenTypeEnum {
        Erc20,
        Erc721,
        Omni,
        Bep20,
        Trc20,
        Trc721
    }
    enum DirectionEnum {
        Incoming,
        Outgoing
    }
}
