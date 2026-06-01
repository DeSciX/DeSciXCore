import { ListTransactionsByBlockHeightXRPRIFee } from './listTransactionsByBlockHeightXRPRIFee';
import { ListTransactionsByBlockHeightXRPRIOffer } from './listTransactionsByBlockHeightXRPRIOffer';
import { ListTransactionsByBlockHeightXRPRIReceive } from './listTransactionsByBlockHeightXRPRIReceive';
import { ListTransactionsByBlockHeightXRPRIValue } from './listTransactionsByBlockHeightXRPRIValue';
export declare class ListTransactionsByBlockHeightXRPRI {
    'additionalData'?: string;
    'destinationTag'?: number;
    'hash': string;
    'positionInBlock': number;
    'recipient': string;
    'sender': string;
    'status': string;
    'timestamp': number;
    'type': string;
    'fee': ListTransactionsByBlockHeightXRPRIFee;
    'offer': ListTransactionsByBlockHeightXRPRIOffer;
    'receive': ListTransactionsByBlockHeightXRPRIReceive;
    'value': ListTransactionsByBlockHeightXRPRIValue;
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
