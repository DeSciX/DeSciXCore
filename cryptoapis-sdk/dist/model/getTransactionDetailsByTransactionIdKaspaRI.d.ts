import { GetTransactionDetailsByTransactionIdKaspaRIFee } from './getTransactionDetailsByTransactionIdKaspaRIFee';
import { GetTransactionDetailsByTransactionIdKaspaRIInputsInner } from './getTransactionDetailsByTransactionIdKaspaRIInputsInner';
import { GetTransactionDetailsByTransactionIdKaspaRIOutputsInner } from './getTransactionDetailsByTransactionIdKaspaRIOutputsInner';
export declare class GetTransactionDetailsByTransactionIdKaspaRI {
    'blocksHashes': Array<string>;
    'fee'?: GetTransactionDetailsByTransactionIdKaspaRIFee;
    'hash': string;
    'id': string;
    'inputs': Array<GetTransactionDetailsByTransactionIdKaspaRIInputsInner>;
    'outputs': Array<GetTransactionDetailsByTransactionIdKaspaRIOutputsInner>;
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
