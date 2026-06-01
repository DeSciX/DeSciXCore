import { GetAddressBalanceKaspaRIConfirmedBalance } from './getAddressBalanceKaspaRIConfirmedBalance';
export declare class GetAddressBalanceKaspaRI {
    'confirmedBalance': GetAddressBalanceKaspaRIConfirmedBalance;
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
