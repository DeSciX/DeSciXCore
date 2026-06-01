import { ListSyncedAddressTokensTransferEVMRIFee } from './listSyncedAddressTokensTransferEVMRIFee';
import { ListSyncedAddressTokensTransferEVMRIMinedInBlock } from './listSyncedAddressTokensTransferEVMRIMinedInBlock';
import { ListSyncedAddressTokensTransferEVMRITokenData } from './listSyncedAddressTokensTransferEVMRITokenData';
export declare class ListSyncedAddressTokensTransferEVMRI {
    'recipient': string;
    'sender': string;
    'timestamp': number;
    'fee': ListSyncedAddressTokensTransferEVMRIFee;
    'tokenData': ListSyncedAddressTokensTransferEVMRITokenData;
    'transactionHash': string;
    'minedInBlock': ListSyncedAddressTokensTransferEVMRIMinedInBlock;
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
