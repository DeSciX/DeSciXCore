import { NotFound } from './notFound';
export declare class GetAddressStatisticsEVM404Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': NotFound;
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
