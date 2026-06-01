import { ListBlockchainEventsSubscriptionsRI } from './listBlockchainEventsSubscriptionsRI';
export declare class ListBlockchainEventsSubscriptionsRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListBlockchainEventsSubscriptionsRI>;
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
