import { PrepareANonFungibleTokenTransferFromAddressEVMRIFee } from './prepareANonFungibleTokenTransferFromAddressEVMRIFee';
import { PrepareANonFungibleTokenTransferFromAddressEVMRIValue } from './prepareANonFungibleTokenTransferFromAddressEVMRIValue';
export declare class PrepareANonFungibleTokenTransferFromAddressEVMRI {
    'inputData': string;
    'nonce': number;
    'recipient': string;
    'sender': string;
    'sigHash': string;
    'value': PrepareANonFungibleTokenTransferFromAddressEVMRIValue;
    'fee': PrepareANonFungibleTokenTransferFromAddressEVMRIFee;
    'gasLimit': number;
    'type': PrepareANonFungibleTokenTransferFromAddressEVMRI.TypeEnum;
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
export declare namespace PrepareANonFungibleTokenTransferFromAddressEVMRI {
    enum TypeEnum {
        LegacyTransaction,
        AccessListTransaction,
        GasFeeMarketTransaction
    }
}
