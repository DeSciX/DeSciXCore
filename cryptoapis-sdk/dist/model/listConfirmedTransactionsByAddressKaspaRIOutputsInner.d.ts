import { ListConfirmedTransactionsByAddressKaspaRIOutputsInnerValue } from './listConfirmedTransactionsByAddressKaspaRIOutputsInnerValue';
export declare class ListConfirmedTransactionsByAddressKaspaRIOutputsInner {
    'address': string;
    'value': ListConfirmedTransactionsByAddressKaspaRIOutputsInnerValue;
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
