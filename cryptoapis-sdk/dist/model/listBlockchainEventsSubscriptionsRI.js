"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBlockchainEventsSubscriptionsRI = void 0;
var ListBlockchainEventsSubscriptionsRI = (function () {
    function ListBlockchainEventsSubscriptionsRI() {
    }
    ListBlockchainEventsSubscriptionsRI.getAttributeTypeMap = function () {
        return ListBlockchainEventsSubscriptionsRI.attributeTypeMap;
    };
    ListBlockchainEventsSubscriptionsRI.discriminator = undefined;
    ListBlockchainEventsSubscriptionsRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "callbackSecretKey",
            "baseName": "callbackSecretKey",
            "type": "string"
        },
        {
            "name": "callbackUrl",
            "baseName": "callbackUrl",
            "type": "string"
        },
        {
            "name": "confirmationsCount",
            "baseName": "confirmationsCount",
            "type": "number"
        },
        {
            "name": "createdTimestamp",
            "baseName": "createdTimestamp",
            "type": "number"
        },
        {
            "name": "deactivationReasons",
            "baseName": "deactivationReasons",
            "type": "Array<ListBlockchainEventsSubscriptionsRIDeactivationReasonsInner>"
        },
        {
            "name": "eventType",
            "baseName": "eventType",
            "type": "string"
        },
        {
            "name": "isActive",
            "baseName": "isActive",
            "type": "boolean"
        },
        {
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        }
    ];
    return ListBlockchainEventsSubscriptionsRI;
}());
exports.ListBlockchainEventsSubscriptionsRI = ListBlockchainEventsSubscriptionsRI;
//# sourceMappingURL=listBlockchainEventsSubscriptionsRI.js.map