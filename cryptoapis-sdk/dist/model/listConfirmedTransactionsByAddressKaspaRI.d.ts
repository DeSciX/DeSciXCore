import { ListConfirmedTransactionsByAddressKaspaRIFee } from './listConfirmedTransactionsByAddressKaspaRIFee';
import { ListConfirmedTransactionsByAddressKaspaRIInputsInner } from './listConfirmedTransactionsByAddressKaspaRIInputsInner';
import { ListConfirmedTransactionsByAddressKaspaRIOutputsInner } from './listConfirmedTransactionsByAddressKaspaRIOutputsInner';
export declare class ListConfirmedTransactionsByAddressKaspaRI {
    'blocksHashes': Array<string>;
    'fee'?: ListConfirmedTransactionsByAddressKaspaRIFee;
    'hash': string;
    'id': string;
    'inputs': Array<ListConfirmedTransactionsByAddressKaspaRIInputsInner>;
    'outputs': Array<ListConfirmedTransactionsByAddressKaspaRIOutputsInner>;
    'timestamp': number;
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
