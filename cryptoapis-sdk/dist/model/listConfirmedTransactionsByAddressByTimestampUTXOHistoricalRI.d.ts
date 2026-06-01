import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIFee } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIFee';
import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner';
import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIMinedInBlock } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIMinedInBlock';
import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner';
import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIRecipientsInner } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIRecipientsInner';
import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRISendersInner } from './listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRISendersInner';
export declare class ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI {
    'fee': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIFee;
    'hash': string;
    'id': string;
    'inputs': Array<ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner>;
    'locktime': number;
    'outputs': Array<ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner>;
    'positionInBlock': number;
    'recipients': Array<ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIRecipientsInner>;
    'senders': Array<ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRISendersInner>;
    'size': number;
    'timestamp': number;
    'version': number;
    'minedInBlock': ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIMinedInBlock;
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
