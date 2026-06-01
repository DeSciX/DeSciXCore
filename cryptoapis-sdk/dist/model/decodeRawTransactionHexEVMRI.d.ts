import { DecodeRawTransactionHexEVMRIBSE } from './decodeRawTransactionHexEVMRIBSE';
import { DecodeRawTransactionHexEVMRIFee } from './decodeRawTransactionHexEVMRIFee';
import { DecodeRawTransactionHexEVMRIGasPrice } from './decodeRawTransactionHexEVMRIGasPrice';
import { DecodeRawTransactionHexEVMRIValue } from './decodeRawTransactionHexEVMRIValue';
export declare class DecodeRawTransactionHexEVMRI {
    'id': string;
    'gasLimit': number;
    'gasPaidForData': number;
    'inputData': string;
    'nonce': number;
    'r': string;
    'recipient': string;
    's': string;
    'sender': string;
    'type': number;
    'v': string;
    'fee': DecodeRawTransactionHexEVMRIFee;
    'gasPrice': DecodeRawTransactionHexEVMRIGasPrice;
    'value': DecodeRawTransactionHexEVMRIValue;
    'blockchainSpecific'?: DecodeRawTransactionHexEVMRIBSE;
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
