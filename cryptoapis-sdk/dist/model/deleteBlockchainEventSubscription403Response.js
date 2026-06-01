"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteBlockchainEventSubscription403Response = void 0;
var DeleteBlockchainEventSubscription403Response = (function () {
    function DeleteBlockchainEventSubscription403Response() {
    }
    DeleteBlockchainEventSubscription403Response.getAttributeTypeMap = function () {
        return DeleteBlockchainEventSubscription403Response.attributeTypeMap;
    };
    DeleteBlockchainEventSubscription403Response.discriminator = undefined;
    DeleteBlockchainEventSubscription403Response.attributeTypeMap = [
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
            "type": "DeleteBlockchainEventSubscriptionE403"
        }
    ];
    return DeleteBlockchainEventSubscription403Response;
}());
exports.DeleteBlockchainEventSubscription403Response = DeleteBlockchainEventSubscription403Response;
//# sourceMappingURL=deleteBlockchainEventSubscription403Response.js.map