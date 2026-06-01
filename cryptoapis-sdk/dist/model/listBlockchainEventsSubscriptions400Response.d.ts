import { ListBlockchainEventsSubscriptionsE400 } from './listBlockchainEventsSubscriptionsE400';
export declare class ListBlockchainEventsSubscriptions400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListBlockchainEventsSubscriptionsE400;
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
