import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIMinedInBlock } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIMinedInBlock';
import { ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ } from './listConfirmedTransactionsByAddressUTXOHistoricalRIBSZ';
import { ListConfirmedTransactionsByAddressUTXOHistoricalRIBlockchaiSpecific } from './listConfirmedTransactionsByAddressUTXOHistoricalRIBlockchaiSpecific';
import { ListConfirmedTransactionsByAddressUTXOHistoricalRIFee } from './listConfirmedTransactionsByAddressUTXOHistoricalRIFee';
import { ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner } from './listConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner';
import { ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner } from './listConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner';
import { ListConfirmedTransactionsByAddressUTXOHistoricalRIRecipientsInner } from './listConfirmedTransactionsByAddressUTXOHistoricalRIRecipientsInner';
import { ListConfirmedTransactionsByAddressUTXOHistoricalRISendersInner } from './listConfirmedTransactionsByAddressUTXOHistoricalRISendersInner';
export declare class ListConfirmedTransactionsByAddressUTXOHistoricalRI {
    'fee': ListConfirmedTransactionsByAddressUTXOHistoricalRIFee;
    'hash': string;
    'id': string;
    'locktime': number;
    'positionInBlock': number;
    'size': number;
    'timestamp': number;
    'version': number;
    'minedInBlock': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIMinedInBlock;
    'inputs': Array<ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner>;
    'outputs': Array<ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner>;
    'recipients': Array<ListConfirmedTransactionsByAddressUTXOHistoricalRIRecipientsInner>;
    'senders': Array<ListConfirmedTransactionsByAddressUTXOHistoricalRISendersInner>;
    'blockchaiSpecific': ListConfirmedTransactionsByAddressUTXOHistoricalRIBlockchaiSpecific;
    'blockchainSpecific'?: ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ;
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
