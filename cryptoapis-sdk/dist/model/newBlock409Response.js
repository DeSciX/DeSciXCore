"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewBlock409Response = void 0;
var NewBlock409Response = (function () {
    function NewBlock409Response() {
    }
    NewBlock409Response.getAttributeTypeMap = function () {
        return NewBlock409Response.attributeTypeMap;
    };
    NewBlock409Response.discriminator = undefined;
    NewBlock409Response.attributeTypeMap = [
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
            "type": "NewBlockE409"
        }
    ];
    return NewBlock409Response;
}());
exports.NewBlock409Response = NewBlock409Response;
//# sourceMappingURL=newBlock409Response.js.map