"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteBlockchainEventSubscription401Response = void 0;
var DeleteBlockchainEventSubscription401Response = (function () {
    function DeleteBlockchainEventSubscription401Response() {
    }
    DeleteBlockchainEventSubscription401Response.getAttributeTypeMap = function () {
        return DeleteBlockchainEventSubscription401Response.attributeTypeMap;
    };
    DeleteBlockchainEventSubscription401Response.discriminator = undefined;
    DeleteBlockchainEventSubscription401Response.attributeTypeMap = [
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
            "type": "DeleteBlockchainEventSubscriptionE401"
        }
    ];
    return DeleteBlockchainEventSubscription401Response;
}());
exports.DeleteBlockchainEventSubscription401Response = DeleteBlockchainEventSubscription401Response;
//# sourceMappingURL=deleteBlockchainEventSubscription401Response.js.map