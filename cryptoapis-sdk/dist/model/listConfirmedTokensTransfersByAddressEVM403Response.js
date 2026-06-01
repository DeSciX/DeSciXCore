"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTokensTransfersByAddressEVM403Response = void 0;
var ListConfirmedTokensTransfersByAddressEVM403Response = (function () {
    function ListConfirmedTokensTransfersByAddressEVM403Response() {
    }
    ListConfirmedTokensTransfersByAddressEVM403Response.getAttributeTypeMap = function () {
        return ListConfirmedTokensTransfersByAddressEVM403Response.attributeTypeMap;
    };
    ListConfirmedTokensTransfersByAddressEVM403Response.discriminator = undefined;
    ListConfirmedTokensTransfersByAddressEVM403Response.attributeTypeMap = [
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
            "type": "ListConfirmedTokensTransfersByAddressEVME403"
        }
    ];
    return ListConfirmedTokensTransfersByAddressEVM403Response;
}());
exports.ListConfirmedTokensTransfersByAddressEVM403Response = ListConfirmedTokensTransfersByAddressEVM403Response;
//# sourceMappingURL=listConfirmedTokensTransfersByAddressEVM403Response.js.map