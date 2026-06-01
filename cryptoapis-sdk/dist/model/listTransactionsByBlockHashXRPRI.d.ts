import { ListTransactionsByBlockHashXRPRIFee } from './listTransactionsByBlockHashXRPRIFee';
import { ListTransactionsByBlockHashXRPRIOffer } from './listTransactionsByBlockHashXRPRIOffer';
import { ListTransactionsByBlockHashXRPRIReceive } from './listTransactionsByBlockHashXRPRIReceive';
import { ListTransactionsByBlockHashXRPRIValue } from './listTransactionsByBlockHashXRPRIValue';
export declare class ListTransactionsByBlockHashXRPRI {
    'additionalData'?: string;
    'destinationTag'?: number;
    'hash': string;
    'offer': ListTransactionsByBlockHashXRPRIOffer;
    'positionInBlock': number;
    'recipient': string;
    'sender': string;
    'status': string;
    'timestamp': number;
    'type': string;
    'fee': ListTransactionsByBlockHashXRPRIFee;
    'receive': ListTransactionsByBlockHashXRPRIReceive;
    'value': ListTransactionsByBlockHashXRPRIValue;
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
