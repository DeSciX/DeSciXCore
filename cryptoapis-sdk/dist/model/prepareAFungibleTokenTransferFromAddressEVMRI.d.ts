import { PrepareAFungibleTokenTransferFromAddressEVMRIFee } from './prepareAFungibleTokenTransferFromAddressEVMRIFee';
import { PrepareAFungibleTokenTransferFromAddressEVMRIValue } from './prepareAFungibleTokenTransferFromAddressEVMRIValue';
export declare class PrepareAFungibleTokenTransferFromAddressEVMRI {
    'inputData': string;
    'nonce': number;
    'recipient': string;
    'sender': string;
    'sigHash': string;
    'value': PrepareAFungibleTokenTransferFromAddressEVMRIValue;
    'fee': PrepareAFungibleTokenTransferFromAddressEVMRIFee;
    'gasLimit': number;
    'type': PrepareAFungibleTokenTransferFromAddressEVMRI.TypeEnum;
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
export declare namespace PrepareAFungibleTokenTransferFromAddressEVMRI {
    enum TypeEnum {
        LegacyTransaction,
        AccessListTransaction,
        GasFeeMarketTransaction
    }
}
