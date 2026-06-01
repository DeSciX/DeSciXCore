import { ListTransactionsByAddressXRPRIFee } from './listTransactionsByAddressXRPRIFee';
import { ListTransactionsByAddressXRPRIMinedInBlock } from './listTransactionsByAddressXRPRIMinedInBlock';
import { ListTransactionsByAddressXRPRIOffer } from './listTransactionsByAddressXRPRIOffer';
import { ListTransactionsByAddressXRPRIReceive } from './listTransactionsByAddressXRPRIReceive';
import { ListTransactionsByAddressXRPRIValue } from './listTransactionsByAddressXRPRIValue';
export declare class ListTransactionsByAddressXRPRI {
    'destinationTag'?: number;
    'hash': string;
    'positionInBlock': number;
    'recipient': string;
    'sender': string;
    'status': string;
    'timestamp': number;
    'type': string;
    'fee': ListTransactionsByAddressXRPRIFee;
    'minedInBlock': ListTransactionsByAddressXRPRIMinedInBlock;
    'offer': ListTransactionsByAddressXRPRIOffer;
    'receive': ListTransactionsByAddressXRPRIReceive;
    'value': ListTransactionsByAddressXRPRIValue;
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
