"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewBlock400Response = void 0;
var NewBlock400Response = (function () {
    function NewBlock400Response() {
    }
    NewBlock400Response.getAttributeTypeMap = function () {
        return NewBlock400Response.attributeTypeMap;
    };
    NewBlock400Response.discriminator = undefined;
    NewBlock400Response.attributeTypeMap = [
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
            "type": "NewBlockE400"
        }
    ];
    return NewBlock400Response;
}());
exports.NewBlock400Response = NewBlock400Response;
//# sourceMappingURL=newBlock400Response.js.map