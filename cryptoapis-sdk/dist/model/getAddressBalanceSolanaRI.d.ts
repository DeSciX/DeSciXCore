import { GetAddressBalanceSolanaRIConfirmedBalance } from './getAddressBalanceSolanaRIConfirmedBalance';
export declare class GetAddressBalanceSolanaRI {
    'confirmedBalance': GetAddressBalanceSolanaRIConfirmedBalance;
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
