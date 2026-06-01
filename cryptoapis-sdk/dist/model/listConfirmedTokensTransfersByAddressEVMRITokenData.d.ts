import { ListConfirmedTokensTransfersByAddressEVMRITokenDataFungibleValues } from './listConfirmedTokensTransfersByAddressEVMRITokenDataFungibleValues';
import { ListConfirmedTokensTransfersByAddressEVMRITokenDataNonFungibleValues } from './listConfirmedTokensTransfersByAddressEVMRITokenDataNonFungibleValues';
export declare class ListConfirmedTokensTransfersByAddressEVMRITokenData {
    'name': string;
    'nonFungibleValues'?: ListConfirmedTokensTransfersByAddressEVMRITokenDataNonFungibleValues;
    'symbol': string;
    'contractAddress': string;
    'fungibleValues': ListConfirmedTokensTransfersByAddressEVMRITokenDataFungibleValues;
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
