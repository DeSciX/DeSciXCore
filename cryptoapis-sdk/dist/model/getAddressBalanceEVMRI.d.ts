import { GetAddressBalanceEVMRIConfirmedBalance } from './getAddressBalanceEVMRIConfirmedBalance';
export declare class GetAddressBalanceEVMRI {
    'confirmedBalance': GetAddressBalanceEVMRIConfirmedBalance;
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
