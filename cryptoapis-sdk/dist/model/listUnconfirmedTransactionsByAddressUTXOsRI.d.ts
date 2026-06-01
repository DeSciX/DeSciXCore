import { ListUnconfirmedTransactionsByAddressUTXOsRIBSZ } from './listUnconfirmedTransactionsByAddressUTXOsRIBSZ';
import { ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner } from './listUnconfirmedTransactionsByAddressUTXOsRIInputsInner';
import { ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner } from './listUnconfirmedTransactionsByAddressUTXOsRIOutputsInner';
import { ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner } from './listUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner';
import { ListUnconfirmedTransactionsByAddressUTXOsRISendersInner } from './listUnconfirmedTransactionsByAddressUTXOsRISendersInner';
export declare class ListUnconfirmedTransactionsByAddressUTXOsRI {
    'hash': string;
    'id': string;
    'isReplaceable': boolean;
    'locktime': number;
    'size': number;
    'timestamp': number;
    'version': number;
    'inputs': Array<ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner>;
    'outputs': Array<ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner>;
    'recipients': Array<ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner>;
    'senders': Array<ListUnconfirmedTransactionsByAddressUTXOsRISendersInner>;
    'blockchainSpecific'?: ListUnconfirmedTransactionsByAddressUTXOsRIBSZ;
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
