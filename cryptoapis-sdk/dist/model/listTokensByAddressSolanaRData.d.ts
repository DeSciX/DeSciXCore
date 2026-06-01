import { ListTokensByAddressSolanaRI } from './listTokensByAddressSolanaRI';
export declare class ListTokensByAddressSolanaRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListTokensByAddressSolanaRI>;
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
