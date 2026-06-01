import { ListBlockchainEventsSubscriptionsRIDeactivationReasonsInner } from './listBlockchainEventsSubscriptionsRIDeactivationReasonsInner';
export declare class GetBlockchainEventSubscriptionDetailsByReferenceIDRI {
    'address'?: string;
    'blockchain': string;
    'callbackSecretKey'?: string;
    'callbackUrl': string;
    'confirmationsCount'?: number;
    'createdTimestamp': number;
    'deactivationReasons'?: Array<ListBlockchainEventsSubscriptionsRIDeactivationReasonsInner>;
    'eventType': string;
    'isActive': boolean;
    'network': string;
    'referenceId': string;
    'transactionId'?: string;
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
