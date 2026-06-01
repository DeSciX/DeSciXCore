import { ListBlockchainEventsSubscriptionsRIDeactivationReasonsInner } from './listBlockchainEventsSubscriptionsRIDeactivationReasonsInner';
export declare class ListBlockchainEventsSubscriptionsRI {
    'address': string;
    'callbackSecretKey'?: string;
    'callbackUrl': string;
    'confirmationsCount': number;
    'createdTimestamp': number;
    'deactivationReasons'?: Array<ListBlockchainEventsSubscriptionsRIDeactivationReasonsInner>;
    'eventType': string;
    'isActive': boolean;
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
