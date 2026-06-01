import { GetAddressBalanceXRPRIConfirmedBalance } from './getAddressBalanceXRPRIConfirmedBalance';
export declare class GetAddressBalanceXRPRI {
    'confirmedBalance': GetAddressBalanceXRPRIConfirmedBalance;
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
