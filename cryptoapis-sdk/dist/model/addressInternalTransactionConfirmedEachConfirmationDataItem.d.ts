import { AddressInternalTransactionConfirmedEachConfirmationDataItemMinedInBlock } from './addressInternalTransactionConfirmedEachConfirmationDataItemMinedInBlock';
export declare class AddressInternalTransactionConfirmedEachConfirmationDataItem {
    'blockchain': string;
    'network': string;
    'address': string;
    'minedInBlock': AddressInternalTransactionConfirmedEachConfirmationDataItemMinedInBlock;
    'parentTransactionId': string;
    'operationId': string;
    'currentConfirmations': number;
    'targetConfirmations': number;
    'amount': string;
    'unit': string;
    'direction': AddressInternalTransactionConfirmedEachConfirmationDataItem.DirectionEnum;
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
export declare namespace AddressInternalTransactionConfirmedEachConfirmationDataItem {
    enum DirectionEnum {
        Incoming,
        Outgoing
    }
}
