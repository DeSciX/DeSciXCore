"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteBlockchainEventSubscription400Response = void 0;
var DeleteBlockchainEventSubscription400Response = (function () {
    function DeleteBlockchainEventSubscription400Response() {
    }
    DeleteBlockchainEventSubscription400Response.getAttributeTypeMap = function () {
        return DeleteBlockchainEventSubscription400Response.attributeTypeMap;
    };
    DeleteBlockchainEventSubscription400Response.discriminator = undefined;
    DeleteBlockchainEventSubscription400Response.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "error",
            "baseName": "error",
            "type": "DeleteBlockchainEventSubscriptionE400"
        }
    ];
    return DeleteBlockchainEventSubscription400Response;
}());
exports.DeleteBlockchainEventSubscription400Response = DeleteBlockchainEventSubscription400Response;
//# sourceMappingURL=deleteBlockchainEventSubscription400Response.js.map