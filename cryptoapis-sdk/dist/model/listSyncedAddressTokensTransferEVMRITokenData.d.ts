import { ListSyncedAddressTokensTransferEVMRITokenDataFungibleValues } from './listSyncedAddressTokensTransferEVMRITokenDataFungibleValues';
import { ListSyncedAddressTokensTransferEVMRITokenDataNonFungibleValues } from './listSyncedAddressTokensTransferEVMRITokenDataNonFungibleValues';
export declare class ListSyncedAddressTokensTransferEVMRITokenData {
    'fungibleValues': ListSyncedAddressTokensTransferEVMRITokenDataFungibleValues;
    'name': string;
    'nonFungibleValues'?: ListSyncedAddressTokensTransferEVMRITokenDataNonFungibleValues;
    'symbol': string;
    'contractAddress': string;
    'standard': string;
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
