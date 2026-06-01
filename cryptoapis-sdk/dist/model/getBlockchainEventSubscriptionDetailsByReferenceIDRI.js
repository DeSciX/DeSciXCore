"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockchainEventSubscriptionDetailsByReferenceIDRI = void 0;
var GetBlockchainEventSubscriptionDetailsByReferenceIDRI = (function () {
    function GetBlockchainEventSubscriptionDetailsByReferenceIDRI() {
    }
    GetBlockchainEventSubscriptionDetailsByReferenceIDRI.getAttributeTypeMap = function () {
        return GetBlockchainEventSubscriptionDetailsByReferenceIDRI.attributeTypeMap;
    };
    GetBlockchainEventSubscriptionDetailsByReferenceIDRI.discriminator = undefined;
    GetBlockchainEventSubscriptionDetailsByReferenceIDRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "blockchain",
            "baseName": "blockchain",
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
            "name": "network",
            "baseName": "network",
            "type": "string"
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
    return GetBlockchainEventSubscriptionDetailsByReferenceIDRI;
}());
exports.GetBlockchainEventSubscriptionDetailsByReferenceIDRI = GetBlockchainEventSubscriptionDetailsByReferenceIDRI;
//# sourceMappingURL=getBlockchainEventSubscriptionDetailsByReferenceIDRI.js.map