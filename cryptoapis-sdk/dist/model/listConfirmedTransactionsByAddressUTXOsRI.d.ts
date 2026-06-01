import { ListConfirmedTransactionsByAddressUTXOsRIBSZ } from './listConfirmedTransactionsByAddressUTXOsRIBSZ';
import { ListConfirmedTransactionsByAddressUTXOsRIFee } from './listConfirmedTransactionsByAddressUTXOsRIFee';
import { ListConfirmedTransactionsByAddressUTXOsRIInputsInner } from './listConfirmedTransactionsByAddressUTXOsRIInputsInner';
import { ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock } from './listConfirmedTransactionsByAddressUTXOsRIMinedInBlock';
import { ListConfirmedTransactionsByAddressUTXOsRIOutputsInner } from './listConfirmedTransactionsByAddressUTXOsRIOutputsInner';
import { ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner } from './listConfirmedTransactionsByAddressUTXOsRIRecipientsInner';
import { ListConfirmedTransactionsByAddressUTXOsRISendersInner } from './listConfirmedTransactionsByAddressUTXOsRISendersInner';
export declare class ListConfirmedTransactionsByAddressUTXOsRI {
    'id': string;
    'locktime': number;
    'size': number;
    'version': number;
    'fee': ListConfirmedTransactionsByAddressUTXOsRIFee;
    'hash': string;
    'inputs': Array<ListConfirmedTransactionsByAddressUTXOsRIInputsInner>;
    'outputs': Array<ListConfirmedTransactionsByAddressUTXOsRIOutputsInner>;
    'positionInBlock': number;
    'recipients': Array<ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner>;
    'senders': Array<ListConfirmedTransactionsByAddressUTXOsRISendersInner>;
    'timestamp': number;
    'minedInBlock': ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock;
    'blockchainSpecific'?: ListConfirmedTransactionsByAddressUTXOsRIBSZ;
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
