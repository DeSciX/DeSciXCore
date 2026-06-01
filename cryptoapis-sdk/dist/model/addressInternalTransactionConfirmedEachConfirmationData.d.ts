import { AddressInternalTransactionConfirmedEachConfirmationDataItem } from './addressInternalTransactionConfirmedEachConfirmationDataItem';
export declare class AddressInternalTransactionConfirmedEachConfirmationData {
    'product': string;
    'event': string;
    'item': AddressInternalTransactionConfirmedEachConfirmationDataItem;
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
