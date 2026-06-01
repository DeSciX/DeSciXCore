import { GetTransactionDetailsByTransactionHashUTXOsRIBSZ } from './getTransactionDetailsByTransactionHashUTXOsRIBSZ';
import { GetTransactionDetailsByTransactionHashUTXOsRIFee } from './getTransactionDetailsByTransactionHashUTXOsRIFee';
import { GetTransactionDetailsByTransactionHashUTXOsRIInputsInner } from './getTransactionDetailsByTransactionHashUTXOsRIInputsInner';
import { GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock } from './getTransactionDetailsByTransactionHashUTXOsRIMinedInBlock';
import { GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner } from './getTransactionDetailsByTransactionHashUTXOsRIOutputsInner';
import { GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner } from './getTransactionDetailsByTransactionHashUTXOsRIRecipientsInner';
import { GetTransactionDetailsByTransactionHashUTXOsRISendersInner } from './getTransactionDetailsByTransactionHashUTXOsRISendersInner';
export declare class GetTransactionDetailsByTransactionHashUTXOsRI {
    'fee': GetTransactionDetailsByTransactionHashUTXOsRIFee;
    'hash': string;
    'id': string;
    'isConfirmed': boolean;
    'isReplaceable': boolean;
    'locktime': number;
    'positionInBlock': number;
    'size': number;
    'timestamp': number;
    'version': number;
    'minedInBlock': GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock;
    'inputs': Array<GetTransactionDetailsByTransactionHashUTXOsRIInputsInner>;
    'outputs': Array<GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner>;
    'recipients': Array<GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner>;
    'senders': Array<GetTransactionDetailsByTransactionHashUTXOsRISendersInner>;
    'blockchainSpecific'?: GetTransactionDetailsByTransactionHashUTXOsRIBSZ;
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
