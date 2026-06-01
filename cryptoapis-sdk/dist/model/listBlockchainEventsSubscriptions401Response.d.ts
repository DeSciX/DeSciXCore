import { ListBlockchainEventsSubscriptionsE401 } from './listBlockchainEventsSubscriptionsE401';
export declare class ListBlockchainEventsSubscriptions401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListBlockchainEventsSubscriptionsE401;
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
