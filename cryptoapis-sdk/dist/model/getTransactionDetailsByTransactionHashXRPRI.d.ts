import { GetTransactionDetailsByTransactionHashXRPRIFee } from './getTransactionDetailsByTransactionHashXRPRIFee';
import { GetTransactionDetailsByTransactionHashXRPRIMinedInBlock } from './getTransactionDetailsByTransactionHashXRPRIMinedInBlock';
import { GetTransactionDetailsByTransactionHashXRPRIOffer } from './getTransactionDetailsByTransactionHashXRPRIOffer';
import { GetTransactionDetailsByTransactionHashXRPRIReceive } from './getTransactionDetailsByTransactionHashXRPRIReceive';
import { GetTransactionDetailsByTransactionHashXRPRIValue } from './getTransactionDetailsByTransactionHashXRPRIValue';
export declare class GetTransactionDetailsByTransactionHashXRPRI {
    'additionalData': string;
    'destinationTag'?: number;
    'fee': GetTransactionDetailsByTransactionHashXRPRIFee;
    'hash': string;
    'offer': GetTransactionDetailsByTransactionHashXRPRIOffer;
    'positionInBlock': string;
    'receive': GetTransactionDetailsByTransactionHashXRPRIReceive;
    'recipient': string;
    'sender': string;
    'status'?: string;
    'timestamp': number;
    'type': string;
    'value': GetTransactionDetailsByTransactionHashXRPRIValue;
    'minedInBlock': GetTransactionDetailsByTransactionHashXRPRIMinedInBlock;
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
