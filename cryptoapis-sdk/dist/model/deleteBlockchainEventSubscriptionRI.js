"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteBlockchainEventSubscriptionRI = void 0;
var DeleteBlockchainEventSubscriptionRI = (function () {
    function DeleteBlockchainEventSubscriptionRI() {
    }
    DeleteBlockchainEventSubscriptionRI.getAttributeTypeMap = function () {
        return DeleteBlockchainEventSubscriptionRI.attributeTypeMap;
    };
    DeleteBlockchainEventSubscriptionRI.discriminator = undefined;
    DeleteBlockchainEventSubscriptionRI.attributeTypeMap = [
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
            "name": "createdTimestamp",
            "baseName": "createdTimestamp",
            "type": "number"
        },
        {
            "name": "eventType",
            "baseName": "eventType",
            "type": "string"
        },
        {
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        }
    ];
    return DeleteBlockchainEventSubscriptionRI;
}());
exports.DeleteBlockchainEventSubscriptionRI = DeleteBlockchainEventSubscriptionRI;
//# sourceMappingURL=deleteBlockchainEventSubscriptionRI.js.map