import { ListTransactionsByBlockHeightUTXOsRIBSZ } from './listTransactionsByBlockHeightUTXOsRIBSZ';
import { ListTransactionsByBlockHeightUTXOsRIFee } from './listTransactionsByBlockHeightUTXOsRIFee';
import { ListTransactionsByBlockHeightUTXOsRIInputsInner } from './listTransactionsByBlockHeightUTXOsRIInputsInner';
import { ListTransactionsByBlockHeightUTXOsRIOutputsInner } from './listTransactionsByBlockHeightUTXOsRIOutputsInner';
import { ListTransactionsByBlockHeightUTXOsRIRecipientsInner } from './listTransactionsByBlockHeightUTXOsRIRecipientsInner';
import { ListTransactionsByBlockHeightUTXOsRISendersInner } from './listTransactionsByBlockHeightUTXOsRISendersInner';
export declare class ListTransactionsByBlockHeightUTXOsRI {
    'fee': ListTransactionsByBlockHeightUTXOsRIFee;
    'hash': string;
    'id': string;
    'locktime': number;
    'positionInBlock': number;
    'size': number;
    'timestamp': number;
    'version': number;
    'inputs': Array<ListTransactionsByBlockHeightUTXOsRIInputsInner>;
    'outputs': Array<ListTransactionsByBlockHeightUTXOsRIOutputsInner>;
    'recipients': Array<ListTransactionsByBlockHeightUTXOsRIRecipientsInner>;
    'senders': Array<ListTransactionsByBlockHeightUTXOsRISendersInner>;
    'blockchainSpecific'?: ListTransactionsByBlockHeightUTXOsRIBSZ;
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
