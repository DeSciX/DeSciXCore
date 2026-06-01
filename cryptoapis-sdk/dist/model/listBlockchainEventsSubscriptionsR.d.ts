import { ListBlockchainEventsSubscriptionsRData } from './listBlockchainEventsSubscriptionsRData';
export declare class ListBlockchainEventsSubscriptionsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListBlockchainEventsSubscriptionsRData;
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
