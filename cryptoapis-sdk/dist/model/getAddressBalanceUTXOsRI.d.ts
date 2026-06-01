import { GetAddressBalanceUTXOsRIConfirmedBalance } from './getAddressBalanceUTXOsRIConfirmedBalance';
export declare class GetAddressBalanceUTXOsRI {
    'confirmedBalance': GetAddressBalanceUTXOsRIConfirmedBalance;
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
