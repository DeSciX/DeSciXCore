import { ListConfirmedTokensTransfersByAddressEVMRIFee } from './listConfirmedTokensTransfersByAddressEVMRIFee';
import { ListConfirmedTokensTransfersByAddressEVMRIMinedInBlock } from './listConfirmedTokensTransfersByAddressEVMRIMinedInBlock';
import { ListConfirmedTokensTransfersByAddressEVMRITokenData } from './listConfirmedTokensTransfersByAddressEVMRITokenData';
export declare class ListConfirmedTokensTransfersByAddressEVMRI {
    'recipient': string;
    'sender': string;
    'timestamp': number;
    'fee': ListConfirmedTokensTransfersByAddressEVMRIFee;
    'tokenData': ListConfirmedTokensTransfersByAddressEVMRITokenData;
    'transactionHash': string;
    'minedInBlock': ListConfirmedTokensTransfersByAddressEVMRIMinedInBlock;
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
