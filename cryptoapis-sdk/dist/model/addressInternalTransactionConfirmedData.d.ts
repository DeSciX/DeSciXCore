import { AddressInternalTransactionConfirmedDataItem } from './addressInternalTransactionConfirmedDataItem';
export declare class AddressInternalTransactionConfirmedData {
    'product': string;
    'event': string;
    'item': AddressInternalTransactionConfirmedDataItem;
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
