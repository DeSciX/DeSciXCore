import { AddressTokensTransactionConfirmedDataItemMinedInBlock } from './addressTokensTransactionConfirmedDataItemMinedInBlock';
import { AddressTokensTransactionConfirmedEachConfirmationToken } from './addressTokensTransactionConfirmedEachConfirmationToken';
export declare class AddressTokensTransactionConfirmedEachConfirmationDataItem {
    'blockchain': string;
    'network': string;
    'address': string;
    'minedInBlock': AddressTokensTransactionConfirmedDataItemMinedInBlock;
    'transactionId': string;
    'currentConfirmations': number;
    'targetConfirmations': number;
    'tokenType': AddressTokensTransactionConfirmedEachConfirmationDataItem.TokenTypeEnum;
    'token': AddressTokensTransactionConfirmedEachConfirmationToken;
    'direction': AddressTokensTransactionConfirmedEachConfirmationDataItem.DirectionEnum;
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
export declare namespace AddressTokensTransactionConfirmedEachConfirmationDataItem {
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
