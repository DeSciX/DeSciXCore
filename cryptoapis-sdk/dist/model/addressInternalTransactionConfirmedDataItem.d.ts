import { AddressInternalTransactionConfirmedDataItemMinedInBlock } from './addressInternalTransactionConfirmedDataItemMinedInBlock';
export declare class AddressInternalTransactionConfirmedDataItem {
    'blockchain': string;
    'network': string;
    'address': string;
    'minedInBlock': AddressInternalTransactionConfirmedDataItemMinedInBlock;
    'parentTransactionId': string;
    'operationId': string;
    'amount': string;
    'unit': string;
    'direction': AddressInternalTransactionConfirmedDataItem.DirectionEnum;
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
export declare namespace AddressInternalTransactionConfirmedDataItem {
    enum DirectionEnum {
        Incoming,
        Outgoing
    }
}
