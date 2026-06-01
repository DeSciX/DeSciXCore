import { ListTransactionsByBlockHashUTXOsRIBSZ } from './listTransactionsByBlockHashUTXOsRIBSZ';
import { ListTransactionsByBlockHashUTXOsRIFee } from './listTransactionsByBlockHashUTXOsRIFee';
import { ListTransactionsByBlockHashUTXOsRIInputsInner } from './listTransactionsByBlockHashUTXOsRIInputsInner';
import { ListTransactionsByBlockHashUTXOsRIOutputsInner } from './listTransactionsByBlockHashUTXOsRIOutputsInner';
import { ListTransactionsByBlockHashUTXOsRIRecipientsInner } from './listTransactionsByBlockHashUTXOsRIRecipientsInner';
import { ListTransactionsByBlockHashUTXOsRISendersInner } from './listTransactionsByBlockHashUTXOsRISendersInner';
export declare class ListTransactionsByBlockHashUTXOsRI {
    'id': string;
    'locktime': number;
    'size': number;
    'version': number;
    'fee': ListTransactionsByBlockHashUTXOsRIFee;
    'hash': string;
    'inputs': Array<ListTransactionsByBlockHashUTXOsRIInputsInner>;
    'outputs': Array<ListTransactionsByBlockHashUTXOsRIOutputsInner>;
    'positionInBlock': number;
    'recipients': Array<ListTransactionsByBlockHashUTXOsRIRecipientsInner>;
    'senders': Array<ListTransactionsByBlockHashUTXOsRISendersInner>;
    'blockchainSpecific'?: ListTransactionsByBlockHashUTXOsRIBSZ;
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
