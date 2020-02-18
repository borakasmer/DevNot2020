/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/language-service/src/expression_diagnostics", ["require", "exports", "tslib", "@angular/compiler", "typescript", "@angular/language-service/src/expression_type", "@angular/language-service/src/symbols", "@angular/language-service/src/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var ts = require("typescript");
    var expression_type_1 = require("@angular/language-service/src/expression_type");
    var symbols_1 = require("@angular/language-service/src/symbols");
    var utils_1 = require("@angular/language-service/src/utils");
    function getTemplateExpressionDiagnostics(info) {
        var visitor = new ExpressionDiagnosticsVisitor(info, function (path) { return getExpressionScope(info, path); });
        compiler_1.templateVisitAll(visitor, info.templateAst);
        return visitor.diagnostics;
    }
    exports.getTemplateExpressionDiagnostics = getTemplateExpressionDiagnostics;
    function getReferences(info) {
        var result = [];
        function processReferences(references) {
            var e_1, _a;
            var _loop_1 = function (reference) {
                var type = undefined;
                if (reference.value) {
                    type = info.query.getTypeSymbol(compiler_1.tokenReference(reference.value));
                }
                result.push({
                    name: reference.name,
                    kind: 'reference',
                    type: type || info.query.getBuiltinType(symbols_1.BuiltinType.Any),
                    get definition() { return getDefinitionOf(info, reference); }
                });
            };
            try {
                for (var references_1 = tslib_1.__values(references), references_1_1 = references_1.next(); !references_1_1.done; references_1_1 = references_1.next()) {
                    var reference = references_1_1.value;
                    _loop_1(reference);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (references_1_1 && !references_1_1.done && (_a = references_1.return)) _a.call(references_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        var visitor = new /** @class */ (function (_super) {
            tslib_1.__extends(class_1, _super);
            function class_1() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_1.prototype.visitEmbeddedTemplate = function (ast, context) {
                _super.prototype.visitEmbeddedTemplate.call(this, ast, context);
                processReferences(ast.references);
            };
            class_1.prototype.visitElement = function (ast, context) {
                _super.prototype.visitElement.call(this, ast, context);
                processReferences(ast.references);
            };
            return class_1;
        }(compiler_1.RecursiveTemplateAstVisitor));
        compiler_1.templateVisitAll(visitor, info.templateAst);
        return result;
    }
    function getDefinitionOf(info, ast) {
        if (info.fileName) {
            var templateOffset = info.offset;
            return [{
                    fileName: info.fileName,
                    span: {
                        start: ast.sourceSpan.start.offset + templateOffset,
                        end: ast.sourceSpan.end.offset + templateOffset
                    }
                }];
        }
    }
    /**
     * Resolve all variable declarations in a template by traversing the specified
     * `path`.
     * @param info
     * @param path template AST path
     */
    function getVarDeclarations(info, path) {
        var e_2, _a;
        var results = [];
        for (var current = path.head; current; current = path.childOf(current)) {
            if (!(current instanceof compiler_1.EmbeddedTemplateAst)) {
                continue;
            }
            var _loop_2 = function (variable) {
                var symbol = info.members.get(variable.value) || info.query.getBuiltinType(symbols_1.BuiltinType.Any);
                var kind = info.query.getTypeKind(symbol);
                if (kind === symbols_1.BuiltinType.Any || kind === symbols_1.BuiltinType.Unbound) {
                    // For special cases such as ngFor and ngIf, the any type is not very useful.
                    // We can do better by resolving the binding value.
                    var symbolsInScope = info.query.mergeSymbolTable([
                        info.members,
                        // Since we are traversing the AST path from head to tail, any variables
                        // that have been declared so far are also in scope.
                        info.query.createSymbolTable(results),
                    ]);
                    symbol = refinedVariableType(variable.value, symbolsInScope, info.query, current);
                }
                results.push({
                    name: variable.name,
                    kind: 'variable',
                    type: symbol, get definition() { return getDefinitionOf(info, variable); },
                });
            };
            try {
                for (var _b = (e_2 = void 0, tslib_1.__values(current.variables)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var variable = _c.value;
                    _loop_2(variable);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        return results;
    }
    /**
     * Gets the type of an ngFor exported value, as enumerated in
     * https://angular.io/api/common/NgForOfContext
     * @param value exported value name
     * @param query type symbol query
     */
    function getNgForExportedValueType(value, query) {
        switch (value) {
            case 'index':
            case 'count':
                return query.getBuiltinType(symbols_1.BuiltinType.Number);
            case 'first':
            case 'last':
            case 'even':
            case 'odd':
                return query.getBuiltinType(symbols_1.BuiltinType.Boolean);
        }
    }
    /**
     * Resolve a more specific type for the variable in `templateElement` by inspecting
     * all variables that are in scope in the `mergedTable`. This function is a special
     * case for `ngFor` and `ngIf`. If resolution fails, return the `any` type.
     * @param value variable value name
     * @param mergedTable symbol table for all variables in scope
     * @param query
     * @param templateElement
     */
    function refinedVariableType(value, mergedTable, query, templateElement) {
        // Special case the ngFor directive
        var ngForDirective = templateElement.directives.find(function (d) {
            var name = compiler_1.identifierName(d.directive.type);
            return name == 'NgFor' || name == 'NgForOf';
        });
        if (ngForDirective) {
            var ngForOfBinding = ngForDirective.inputs.find(function (i) { return i.directiveName == 'ngForOf'; });
            if (ngForOfBinding) {
                // Check if the variable value is a type exported by the ngFor statement.
                var result = getNgForExportedValueType(value, query);
                // Otherwise, check if there is a known type for the ngFor binding.
                var bindingType = new expression_type_1.AstType(mergedTable, query, {}).getType(ngForOfBinding.value);
                if (!result && bindingType) {
                    result = query.getElementType(bindingType);
                }
                if (result) {
                    return result;
                }
            }
        }
        // Special case the ngIf directive ( *ngIf="data$ | async as variable" )
        var ngIfDirective = templateElement.directives.find(function (d) { return compiler_1.identifierName(d.directive.type) === 'NgIf'; });
        if (ngIfDirective) {
            var ngIfBinding = ngIfDirective.inputs.find(function (i) { return i.directiveName === 'ngIf'; });
            if (ngIfBinding) {
                var bindingType = new expression_type_1.AstType(mergedTable, query, {}).getType(ngIfBinding.value);
                if (bindingType) {
                    return bindingType;
                }
            }
        }
        // We can't do better, return any
        return query.getBuiltinType(symbols_1.BuiltinType.Any);
    }
    function getEventDeclaration(info, path) {
        var event = path.tail;
        if (!(event instanceof compiler_1.BoundEventAst)) {
            // No event available in this context.
            return;
        }
        var genericEvent = {
            name: '$event',
            kind: 'variable',
            type: info.query.getBuiltinType(symbols_1.BuiltinType.Any),
        };
        var outputSymbol = utils_1.findOutputBinding(event, path, info.query);
        if (!outputSymbol) {
            // The `$event` variable doesn't belong to an output, so its type can't be refined.
            // TODO: type `$event` variables in bindings to DOM events.
            return genericEvent;
        }
        // The raw event type is wrapped in a generic, like EventEmitter<T> or Observable<T>.
        var ta = outputSymbol.typeArguments();
        if (!ta || ta.length !== 1)
            return genericEvent;
        var eventType = ta[0];
        return tslib_1.__assign(tslib_1.__assign({}, genericEvent), { type: eventType });
    }
    /**
     * Returns the symbols available in a particular scope of a template.
     * @param info parsed template information
     * @param path path of template nodes narrowing to the context the expression scope should be
     * derived for.
     */
    function getExpressionScope(info, path) {
        var result = info.members;
        var references = getReferences(info);
        var variables = getVarDeclarations(info, path);
        var event = getEventDeclaration(info, path);
        if (references.length || variables.length || event) {
            var referenceTable = info.query.createSymbolTable(references);
            var variableTable = info.query.createSymbolTable(variables);
            var eventsTable = info.query.createSymbolTable(event ? [event] : []);
            result = info.query.mergeSymbolTable([result, referenceTable, variableTable, eventsTable]);
        }
        return result;
    }
    exports.getExpressionScope = getExpressionScope;
    var ExpressionDiagnosticsVisitor = /** @class */ (function (_super) {
        tslib_1.__extends(ExpressionDiagnosticsVisitor, _super);
        function ExpressionDiagnosticsVisitor(info, getExpressionScope) {
            var _this = _super.call(this) || this;
            _this.info = info;
            _this.getExpressionScope = getExpressionScope;
            _this.diagnostics = [];
            _this.path = new compiler_1.AstPath([]);
            return _this;
        }
        ExpressionDiagnosticsVisitor.prototype.visitDirective = function (ast, context) {
            // Override the default child visitor to ignore the host properties of a directive.
            if (ast.inputs && ast.inputs.length) {
                compiler_1.templateVisitAll(this, ast.inputs, context);
            }
        };
        ExpressionDiagnosticsVisitor.prototype.visitBoundText = function (ast) {
            this.push(ast);
            this.diagnoseExpression(ast.value, ast.sourceSpan.start.offset, false);
            this.pop();
        };
        ExpressionDiagnosticsVisitor.prototype.visitDirectiveProperty = function (ast) {
            this.push(ast);
            this.diagnoseExpression(ast.value, this.attributeValueLocation(ast), false);
            this.pop();
        };
        ExpressionDiagnosticsVisitor.prototype.visitElementProperty = function (ast) {
            this.push(ast);
            this.diagnoseExpression(ast.value, this.attributeValueLocation(ast), false);
            this.pop();
        };
        ExpressionDiagnosticsVisitor.prototype.visitEvent = function (ast) {
            this.push(ast);
            this.diagnoseExpression(ast.handler, this.attributeValueLocation(ast), true);
            this.pop();
        };
        ExpressionDiagnosticsVisitor.prototype.visitVariable = function (ast) {
            var directive = this.directiveSummary;
            if (directive && ast.value) {
                var context = this.info.query.getTemplateContext(directive.type.reference);
                if (context && !context.has(ast.value)) {
                    var missingMember = ast.value === '$implicit' ? 'an implicit value' : "a member called '" + ast.value + "'";
                    this.reportDiagnostic("The template context of '" + directive.type.reference.name + "' does not define " + missingMember + ".\n" +
                        "If the context type is a base type or 'any', consider refining it to a more specific type.", spanOf(ast.sourceSpan), ts.DiagnosticCategory.Suggestion);
                }
            }
        };
        ExpressionDiagnosticsVisitor.prototype.visitElement = function (ast, context) {
            this.push(ast);
            _super.prototype.visitElement.call(this, ast, context);
            this.pop();
        };
        ExpressionDiagnosticsVisitor.prototype.visitEmbeddedTemplate = function (ast, context) {
            var previousDirectiveSummary = this.directiveSummary;
            this.push(ast);
            // Find directive that references this template
            this.directiveSummary =
                ast.directives.map(function (d) { return d.directive; }).find(function (d) { return hasTemplateReference(d.type); });
            // Process children
            _super.prototype.visitEmbeddedTemplate.call(this, ast, context);
            this.pop();
            this.directiveSummary = previousDirectiveSummary;
        };
        ExpressionDiagnosticsVisitor.prototype.attributeValueLocation = function (ast) {
            var path = utils_1.getPathToNodeAtPosition(this.info.htmlAst, ast.sourceSpan.start.offset);
            var last = path.tail;
            if (last instanceof compiler_1.Attribute && last.valueSpan) {
                return last.valueSpan.start.offset;
            }
            return ast.sourceSpan.start.offset;
        };
        ExpressionDiagnosticsVisitor.prototype.diagnoseExpression = function (ast, offset, event) {
            var e_3, _a;
            var scope = this.getExpressionScope(this.path, event);
            var analyzer = new expression_type_1.AstType(scope, this.info.query, { event: event });
            try {
                for (var _b = tslib_1.__values(analyzer.getDiagnostics(ast)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = _c.value, message = _d.message, span = _d.span, kind = _d.kind;
                    span.start += offset;
                    span.end += offset;
                    this.reportDiagnostic(message, span, kind);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_3) throw e_3.error; }
            }
        };
        ExpressionDiagnosticsVisitor.prototype.push = function (ast) { this.path.push(ast); };
        ExpressionDiagnosticsVisitor.prototype.pop = function () { this.path.pop(); };
        ExpressionDiagnosticsVisitor.prototype.reportDiagnostic = function (message, span, kind) {
            if (kind === void 0) { kind = ts.DiagnosticCategory.Error; }
            span.start += this.info.offset;
            span.end += this.info.offset;
            this.diagnostics.push({ kind: kind, span: span, message: message });
        };
        return ExpressionDiagnosticsVisitor;
    }(compiler_1.RecursiveTemplateAstVisitor));
    function hasTemplateReference(type) {
        var e_4, _a;
        if (type.diDeps) {
            try {
                for (var _b = tslib_1.__values(type.diDeps), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var diDep = _c.value;
                    if (diDep.token && diDep.token.identifier &&
                        compiler_1.identifierName(diDep.token.identifier) == 'TemplateRef')
                        return true;
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        return false;
    }
    function spanOf(sourceSpan) {
        return { start: sourceSpan.start.offset, end: sourceSpan.end.offset };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzc2lvbl9kaWFnbm9zdGljcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2xhbmd1YWdlLXNlcnZpY2Uvc3JjL2V4cHJlc3Npb25fZGlhZ25vc3RpY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsOENBQXVZO0lBQ3ZZLCtCQUFpQztJQUVqQyxpRkFBMEM7SUFDMUMsaUVBQTZHO0lBRTdHLDZEQUFtRTtJQVduRSxTQUFnQixnQ0FBZ0MsQ0FBQyxJQUE0QjtRQUMzRSxJQUFNLE9BQU8sR0FBRyxJQUFJLDRCQUE0QixDQUM1QyxJQUFJLEVBQUUsVUFBQyxJQUFxQixJQUFLLE9BQUEsa0JBQWtCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUE5QixDQUE4QixDQUFDLENBQUM7UUFDckUsMkJBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM1QyxPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUM7SUFDN0IsQ0FBQztJQUxELDRFQUtDO0lBRUQsU0FBUyxhQUFhLENBQUMsSUFBNEI7UUFDakQsSUFBTSxNQUFNLEdBQXdCLEVBQUUsQ0FBQztRQUV2QyxTQUFTLGlCQUFpQixDQUFDLFVBQTBCOztvQ0FDeEMsU0FBUztnQkFDbEIsSUFBSSxJQUFJLEdBQXFCLFNBQVMsQ0FBQztnQkFDdkMsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFO29CQUNuQixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMseUJBQWMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDbEU7Z0JBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7b0JBQ3BCLElBQUksRUFBRSxXQUFXO29CQUNqQixJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUksQ0FB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QUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUM3QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFDLElBQUksTUFBQSxFQUFFLElBQUksTUFBQSxFQUFFLE9BQU8sU0FBQSxFQUFDLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBQ0gsbUNBQUM7SUFBRCxDQUFDLEFBL0dELENBQTJDLHNDQUEyQixHQStHckU7SUFFRCxTQUFTLG9CQUFvQixDQUFDLElBQXlCOztRQUNyRCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7O2dCQUNmLEtBQWtCLElBQUEsS0FBQSxpQkFBQSxJQUFJLENBQUMsTUFBTSxDQUFBLGdCQUFBLDRCQUFFO29CQUExQixJQUFJLEtBQUssV0FBQTtvQkFDWixJQUFJLEtBQUssQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFVO3dCQUNyQyx5QkFBYyxDQUFDLEtBQUssQ0FBQyxLQUFPLENBQUMsVUFBWSxDQUFDLElBQUksYUFBYTt3QkFDN0QsT0FBTyxJQUFJLENBQUM7aUJBQ2Y7Ozs7Ozs7OztTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxNQUFNLENBQUMsVUFBMkI7UUFDekMsT0FBTyxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUMsQ0FBQztJQUN0RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FTVCwgQXN0UGF0aCwgQXR0cmlidXRlLCBCb3VuZERpcmVjdGl2ZVByb3BlcnR5QXN0LCBCb3VuZEVsZW1lbnRQcm9wZXJ0eUFzdCwgQm91bmRFdmVudEFzdCwgQm91bmRUZXh0QXN0LCBDb21waWxlRGlyZWN0aXZlU3VtbWFyeSwgQ29tcGlsZVR5cGVNZXRhZGF0YSwgRGlyZWN0aXZlQXN0LCBFbGVtZW50QXN0LCBFbWJlZGRlZFRlbXBsYXRlQXN0LCBOb2RlLCBQYXJzZVNvdXJjZVNwYW4sIFJlY3Vyc2l2ZVRlbXBsYXRlQXN0VmlzaXRvciwgUmVmZXJlbmNlQXN0LCBUZW1wbGF0ZUFzdCwgVGVtcGxhdGVBc3RQYXRoLCBWYXJpYWJsZUFzdCwgaWRlbnRpZmllck5hbWUsIHRlbXBsYXRlVmlzaXRBbGwsIHRva2VuUmVmZXJlbmNlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtBc3RUeXBlfSBmcm9tICcuL2V4cHJlc3Npb25fdHlwZSc7XG5pbXBvcnQge0J1aWx0aW5UeXBlLCBEZWZpbml0aW9uLCBTcGFuLCBTeW1ib2wsIFN5bWJvbERlY2xhcmF0aW9uLCBTeW1ib2xRdWVyeSwgU3ltYm9sVGFibGV9IGZyb20gJy4vc3ltYm9scyc7XG5pbXBvcnQge0RpYWdub3N0aWN9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtmaW5kT3V0cHV0QmluZGluZywgZ2V0UGF0aFRvTm9kZUF0UG9zaXRpb259IGZyb20gJy4vdXRpbHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIERpYWdub3N0aWNUZW1wbGF0ZUluZm8ge1xuICBmaWxlTmFtZT86IHN0cmluZztcbiAgb2Zmc2V0OiBudW1iZXI7XG4gIHF1ZXJ5OiBTeW1ib2xRdWVyeTtcbiAgbWVtYmVyczogU3ltYm9sVGFibGU7XG4gIGh0bWxBc3Q6IE5vZGVbXTtcbiAgdGVtcGxhdGVBc3Q6IFRlbXBsYXRlQXN0W107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZW1wbGF0ZUV4cHJlc3Npb25EaWFnbm9zdGljcyhpbmZvOiBEaWFnbm9zdGljVGVtcGxhdGVJbmZvKTogRGlhZ25vc3RpY1tdIHtcbiAgY29uc3QgdmlzaXRvciA9IG5ldyBFeHByZXNzaW9uRGlhZ25vc3RpY3NWaXNpdG9yKFxuICAgICAgaW5mbywgKHBhdGg6IFRlbXBsYXRlQXN0UGF0aCkgPT4gZ2V0RXhwcmVzc2lvblNjb3BlKGluZm8sIHBhdGgpKTtcbiAgdGVtcGxhdGVWaXNpdEFsbCh2aXNpdG9yLCBpbmZvLnRlbXBsYXRlQXN0KTtcbiAgcmV0dXJuIHZpc2l0b3IuZGlhZ25vc3RpY3M7XG59XG5cbmZ1bmN0aW9uIGdldFJlZmVyZW5jZXMoaW5mbzogRGlhZ25vc3RpY1RlbXBsYXRlSW5mbyk6IFN5bWJvbERlY2xhcmF0aW9uW10ge1xuICBjb25zdCByZXN1bHQ6IFN5bWJvbERlY2xhcmF0aW9uW10gPSBbXTtcblxuICBmdW5jdGlvbiBwcm9jZXNzUmVmZXJlbmNlcyhyZWZlcmVuY2VzOiBSZWZlcmVuY2VBc3RbXSkge1xuICAgIGZvciAoY29uc3QgcmVmZXJlbmNlIG9mIHJlZmVyZW5jZXMpIHtcbiAgICAgIGxldCB0eXBlOiBTeW1ib2x8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgaWYgKHJlZmVyZW5jZS52YWx1ZSkge1xuICAgICAgICB0eXBlID0gaW5mby5xdWVyeS5nZXRUeXBlU3ltYm9sKHRva2VuUmVmZXJlbmNlKHJlZmVyZW5jZS52YWx1ZSkpO1xuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICBuYW1lOiByZWZlcmVuY2UubmFtZSxcbiAgICAgICAga2luZDogJ3JlZmVyZW5jZScsXG4gICAgICAgIHR5cGU6IHR5cGUgfHwgaW5mby5xdWVyeS5nZXRCdWlsdGluVHlwZShCdWlsdGluVHlwZS5BbnkpLFxuICAgICAgICBnZXQgZGVmaW5pdGlvbigpIHsgcmV0dXJuIGdldERlZmluaXRpb25PZihpbmZvLCByZWZlcmVuY2UpOyB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBjb25zdCB2aXNpdG9yID0gbmV3IGNsYXNzIGV4dGVuZHMgUmVjdXJzaXZlVGVtcGxhdGVBc3RWaXNpdG9yIHtcbiAgICB2aXNpdEVtYmVkZGVkVGVtcGxhdGUoYXN0OiBFbWJlZGRlZFRlbXBsYXRlQXN0LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgICAgc3VwZXIudmlzaXRFbWJlZGRlZFRlbXBsYXRlKGFzdCwgY29udGV4dCk7XG4gICAgICBwcm9jZXNzUmVmZXJlbmNlcyhhc3QucmVmZXJlbmNlcyk7XG4gICAgfVxuICAgIHZpc2l0RWxlbWVudChhc3Q6IEVsZW1lbnRBc3QsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgICBzdXBlci52aXNpdEVsZW1lbnQoYXN0LCBjb250ZXh0KTtcbiAgICAgIHByb2Nlc3NSZWZlcmVuY2VzKGFzdC5yZWZlcmVuY2VzKTtcbiAgICB9XG4gIH07XG5cbiAgdGVtcGxhdGVWaXNpdEFsbCh2aXNpdG9yLCBpbmZvLnRlbXBsYXRlQXN0KTtcblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBnZXREZWZpbml0aW9uT2YoaW5mbzogRGlhZ25vc3RpY1RlbXBsYXRlSW5mbywgYXN0OiBUZW1wbGF0ZUFzdCk6IERlZmluaXRpb258dW5kZWZpbmVkIHtcbiAgaWYgKGluZm8uZmlsZU5hbWUpIHtcbiAgICBjb25zdCB0ZW1wbGF0ZU9mZnNldCA9IGluZm8ub2Zmc2V0O1xuICAgIHJldHVybiBbe1xuICAgICAgZmlsZU5hbWU6IGluZm8uZmlsZU5hbWUsXG4gICAgICBzcGFuOiB7XG4gICAgICAgIHN0YXJ0OiBhc3Quc291cmNlU3Bhbi5zdGFydC5vZmZzZXQgKyB0ZW1wbGF0ZU9mZnNldCxcbiAgICAgICAgZW5kOiBhc3Quc291cmNlU3Bhbi5lbmQub2Zmc2V0ICsgdGVtcGxhdGVPZmZzZXRcbiAgICAgIH1cbiAgICB9XTtcbiAgfVxufVxuXG4vKipcbiAqIFJlc29sdmUgYWxsIHZhcmlhYmxlIGRlY2xhcmF0aW9ucyBpbiBhIHRlbXBsYXRlIGJ5IHRyYXZlcnNpbmcgdGhlIHNwZWNpZmllZFxuICogYHBhdGhgLlxuICogQHBhcmFtIGluZm9cbiAqIEBwYXJhbSBwYXRoIHRlbXBsYXRlIEFTVCBwYXRoXG4gKi9cbmZ1bmN0aW9uIGdldFZhckRlY2xhcmF0aW9ucyhcbiAgICBpbmZvOiBEaWFnbm9zdGljVGVtcGxhdGVJbmZvLCBwYXRoOiBUZW1wbGF0ZUFzdFBhdGgpOiBTeW1ib2xEZWNsYXJhdGlvbltdIHtcbiAgY29uc3QgcmVzdWx0czogU3ltYm9sRGVjbGFyYXRpb25bXSA9IFtdO1xuICBmb3IgKGxldCBjdXJyZW50ID0gcGF0aC5oZWFkOyBjdXJyZW50OyBjdXJyZW50ID0gcGF0aC5jaGlsZE9mKGN1cnJlbnQpKSB7XG4gICAgaWYgKCEoY3VycmVudCBpbnN0YW5jZW9mIEVtYmVkZGVkVGVtcGxhdGVBc3QpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZm9yIChjb25zdCB2YXJpYWJsZSBvZiBjdXJyZW50LnZhcmlhYmxlcykge1xuICAgICAgbGV0IHN5bWJvbCA9IGluZm8ubWVtYmVycy5nZXQodmFyaWFibGUudmFsdWUpIHx8IGluZm8ucXVlcnkuZ2V0QnVpbHRpblR5cGUoQnVpbHRpblR5cGUuQW55KTtcbiAgICAgIGNvbnN0IGtpbmQgPSBpbmZvLnF1ZXJ5LmdldFR5cGVLaW5kKHN5bWJvbCk7XG4gICAgICBpZiAoa2luZCA9PT0gQnVpbHRpblR5cGUuQW55IHx8IGtpbmQgPT09IEJ1aWx0aW5UeXBlLlVuYm91bmQpIHtcbiAgICAgICAgLy8gRm9yIHNwZWNpYWwgY2FzZXMgc3VjaCBhcyBuZ0ZvciBhbmQgbmdJZiwgdGhlIGFueSB0eXBlIGlzIG5vdCB2ZXJ5IHVzZWZ1bC5cbiAgICAgICAgLy8gV2UgY2FuIGRvIGJldHRlciBieSByZXNvbHZpbmcgdGhlIGJpbmRpbmcgdmFsdWUuXG4gICAgICAgIGNvbnN0IHN5bWJvbHNJblNjb3BlID0gaW5mby5xdWVyeS5tZXJnZVN5bWJvbFRhYmxlKFtcbiAgICAgICAgICBpbmZvLm1lbWJlcnMsXG4gICAgICAgICAgLy8gU2luY2Ugd2UgYXJlIHRyYXZlcnNpbmcgdGhlIEFTVCBwYXRoIGZyb20gaGVhZCB0byB0YWlsLCBhbnkgdmFyaWFibGVzXG4gICAgICAgICAgLy8gdGhhdCBoYXZlIGJlZW4gZGVjbGFyZWQgc28gZmFyIGFyZSBhbHNvIGluIHNjb3BlLlxuICAgICAgICAgIGluZm8ucXVlcnkuY3JlYXRlU3ltYm9sVGFibGUocmVzdWx0cyksXG4gICAgICAgIF0pO1xuICAgICAgICBzeW1ib2wgPSByZWZpbmVkVmFyaWFibGVUeXBlKHZhcmlhYmxlLnZhbHVlLCBzeW1ib2xzSW5TY29wZSwgaW5mby5xdWVyeSwgY3VycmVudCk7XG4gICAgICB9XG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICBuYW1lOiB2YXJpYWJsZS5uYW1lLFxuICAgICAgICBraW5kOiAndmFyaWFibGUnLFxuICAgICAgICB0eXBlOiBzeW1ib2wsIGdldCBkZWZpbml0aW9uKCkgeyByZXR1cm4gZ2V0RGVmaW5pdGlvbk9mKGluZm8sIHZhcmlhYmxlKTsgfSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSB0eXBlIG9mIGFuIG5nRm9yIGV4cG9ydGVkIHZhbHVlLCBhcyBlbnVtZXJhdGVkIGluXG4gKiBodHRwczovL2FuZ3VsYXIuaW8vYXBpL2NvbW1vbi9OZ0Zvck9mQ29udGV4dFxuICogQHBhcmFtIHZhbHVlIGV4cG9ydGVkIHZhbHVlIG5hbWVcbiAqIEBwYXJhbSBxdWVyeSB0eXBlIHN5bWJvbCBxdWVyeVxuICovXG5mdW5jdGlvbiBnZXROZ0ZvckV4cG9ydGVkVmFsdWVUeXBlKHZhbHVlOiBzdHJpbmcsIHF1ZXJ5OiBTeW1ib2xRdWVyeSk6IFN5bWJvbHx1bmRlZmluZWQge1xuICBzd2l0Y2ggKHZhbHVlKSB7XG4gICAgY2FzZSAnaW5kZXgnOlxuICAgIGNhc2UgJ2NvdW50JzpcbiAgICAgIHJldHVybiBxdWVyeS5nZXRCdWlsdGluVHlwZShCdWlsdGluVHlwZS5OdW1iZXIpO1xuICAgIGNhc2UgJ2ZpcnN0JzpcbiAgICBjYXNlICdsYXN0JzpcbiAgICBjYXNlICdldmVuJzpcbiAgICBjYXNlICdvZGQnOlxuICAgICAgcmV0dXJuIHF1ZXJ5LmdldEJ1aWx0aW5UeXBlKEJ1aWx0aW5UeXBlLkJvb2xlYW4pO1xuICB9XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhIG1vcmUgc3BlY2lmaWMgdHlwZSBmb3IgdGhlIHZhcmlhYmxlIGluIGB0ZW1wbGF0ZUVsZW1lbnRgIGJ5IGluc3BlY3RpbmdcbiAqIGFsbCB2YXJpYWJsZXMgdGhhdCBhcmUgaW4gc2NvcGUgaW4gdGhlIGBtZXJnZWRUYWJsZWAuIFRoaXMgZnVuY3Rpb24gaXMgYSBzcGVjaWFsXG4gKiBjYXNlIGZvciBgbmdGb3JgIGFuZCBgbmdJZmAuIElmIHJlc29sdXRpb24gZmFpbHMsIHJldHVybiB0aGUgYGFueWAgdHlwZS5cbiAqIEBwYXJhbSB2YWx1ZSB2YXJpYWJsZSB2YWx1ZSBuYW1lXG4gKiBAcGFyYW0gbWVyZ2VkVGFibGUgc3ltYm9sIHRhYmxlIGZvciBhbGwgdmFyaWFibGVzIGluIHNjb3BlXG4gKiBAcGFyYW0gcXVlcnlcbiAqIEBwYXJhbSB0ZW1wbGF0ZUVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gcmVmaW5lZFZhcmlhYmxlVHlwZShcbiAgICB2YWx1ZTogc3RyaW5nLCBtZXJnZWRUYWJsZTogU3ltYm9sVGFibGUsIHF1ZXJ5OiBTeW1ib2xRdWVyeSxcbiAgICB0ZW1wbGF0ZUVsZW1lbnQ6IEVtYmVkZGVkVGVtcGxhdGVBc3QpOiBTeW1ib2wge1xuICAvLyBTcGVjaWFsIGNhc2UgdGhlIG5nRm9yIGRpcmVjdGl2ZVxuICBjb25zdCBuZ0ZvckRpcmVjdGl2ZSA9IHRlbXBsYXRlRWxlbWVudC5kaXJlY3RpdmVzLmZpbmQoZCA9PiB7XG4gICAgY29uc3QgbmFtZSA9IGlkZW50aWZpZXJOYW1lKGQuZGlyZWN0aXZlLnR5cGUpO1xuICAgIHJldHVybiBuYW1lID09ICdOZ0ZvcicgfHwgbmFtZSA9PSAnTmdGb3JPZic7XG4gIH0pO1xuICBpZiAobmdGb3JEaXJlY3RpdmUpIHtcbiAgICBjb25zdCBuZ0Zvck9mQmluZGluZyA9IG5nRm9yRGlyZWN0aXZlLmlucHV0cy5maW5kKGkgPT4gaS5kaXJlY3RpdmVOYW1lID09ICduZ0Zvck9mJyk7XG4gICAgaWYgKG5nRm9yT2ZCaW5kaW5nKSB7XG4gICAgICAvLyBDaGVjayBpZiB0aGUgdmFyaWFibGUgdmFsdWUgaXMgYSB0eXBlIGV4cG9ydGVkIGJ5IHRoZSBuZ0ZvciBzdGF0ZW1lbnQuXG4gICAgICBsZXQgcmVzdWx0ID0gZ2V0TmdGb3JFeHBvcnRlZFZhbHVlVHlwZSh2YWx1ZSwgcXVlcnkpO1xuXG4gICAgICAvLyBPdGhlcndpc2UsIGNoZWNrIGlmIHRoZXJlIGlzIGEga25vd24gdHlwZSBmb3IgdGhlIG5nRm9yIGJpbmRpbmcuXG4gICAgICBjb25zdCBiaW5kaW5nVHlwZSA9IG5ldyBBc3RUeXBlKG1lcmdlZFRhYmxlLCBxdWVyeSwge30pLmdldFR5cGUobmdGb3JPZkJpbmRpbmcudmFsdWUpO1xuICAgICAgaWYgKCFyZXN1bHQgJiYgYmluZGluZ1R5cGUpIHtcbiAgICAgICAgcmVzdWx0ID0gcXVlcnkuZ2V0RWxlbWVudFR5cGUoYmluZGluZ1R5cGUpO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gU3BlY2lhbCBjYXNlIHRoZSBuZ0lmIGRpcmVjdGl2ZSAoICpuZ0lmPVwiZGF0YSQgfCBhc3luYyBhcyB2YXJpYWJsZVwiIClcbiAgY29uc3QgbmdJZkRpcmVjdGl2ZSA9XG4gICAgICB0ZW1wbGF0ZUVsZW1lbnQuZGlyZWN0aXZlcy5maW5kKGQgPT4gaWRlbnRpZmllck5hbWUoZC5kaXJlY3RpdmUudHlwZSkgPT09ICdOZ0lmJyk7XG4gIGlmIChuZ0lmRGlyZWN0aXZlKSB7XG4gICAgY29uc3QgbmdJZkJpbmRpbmcgPSBuZ0lmRGlyZWN0aXZlLmlucHV0cy5maW5kKGkgPT4gaS5kaXJlY3RpdmVOYW1lID09PSAnbmdJZicpO1xuICAgIGlmIChuZ0lmQmluZGluZykge1xuICAgICAgY29uc3QgYmluZGluZ1R5cGUgPSBuZXcgQXN0VHlwZShtZXJnZWRUYWJsZSwgcXVlcnksIHt9KS5nZXRUeXBlKG5nSWZCaW5kaW5nLnZhbHVlKTtcbiAgICAgIGlmIChiaW5kaW5nVHlwZSkge1xuICAgICAgICByZXR1cm4gYmluZGluZ1R5cGU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gV2UgY2FuJ3QgZG8gYmV0dGVyLCByZXR1cm4gYW55XG4gIHJldHVybiBxdWVyeS5nZXRCdWlsdGluVHlwZShCdWlsdGluVHlwZS5BbnkpO1xufVxuXG5mdW5jdGlvbiBnZXRFdmVudERlY2xhcmF0aW9uKFxuICAgIGluZm86IERpYWdub3N0aWNUZW1wbGF0ZUluZm8sIHBhdGg6IFRlbXBsYXRlQXN0UGF0aCk6IFN5bWJvbERlY2xhcmF0aW9ufHVuZGVmaW5lZCB7XG4gIGNvbnN0IGV2ZW50ID0gcGF0aC50YWlsO1xuICBpZiAoIShldmVudCBpbnN0YW5jZW9mIEJvdW5kRXZlbnRBc3QpKSB7XG4gICAgLy8gTm8gZXZlbnQgYXZhaWxhYmxlIGluIHRoaXMgY29udGV4dC5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBnZW5lcmljRXZlbnQ6IFN5bWJvbERlY2xhcmF0aW9uID0ge1xuICAgIG5hbWU6ICckZXZlbnQnLFxuICAgIGtpbmQ6ICd2YXJpYWJsZScsXG4gICAgdHlwZTogaW5mby5xdWVyeS5nZXRCdWlsdGluVHlwZShCdWlsdGluVHlwZS5BbnkpLFxuICB9O1xuXG4gIGNvbnN0IG91dHB1dFN5bWJvbCA9IGZpbmRPdXRwdXRCaW5kaW5nKGV2ZW50LCBwYXRoLCBpbmZvLnF1ZXJ5KTtcbiAgaWYgKCFvdXRwdXRTeW1ib2wpIHtcbiAgICAvLyBUaGUgYCRldmVudGAgdmFyaWFibGUgZG9lc24ndCBiZWxvbmcgdG8gYW4gb3V0cHV0LCBzbyBpdHMgdHlwZSBjYW4ndCBiZSByZWZpbmVkLlxuICAgIC8vIFRPRE86IHR5cGUgYCRldmVudGAgdmFyaWFibGVzIGluIGJpbmRpbmdzIHRvIERPTSBldmVudHMuXG4gICAgcmV0dXJuIGdlbmVyaWNFdmVudDtcbiAgfVxuXG4gIC8vIFRoZSByYXcgZXZlbnQgdHlwZSBpcyB3cmFwcGVkIGluIGEgZ2VuZXJpYywgbGlrZSBFdmVudEVtaXR0ZXI8VD4gb3IgT2JzZXJ2YWJsZTxUPi5cbiAgY29uc3QgdGEgPSBvdXRwdXRTeW1ib2wudHlwZUFyZ3VtZW50cygpO1xuICBpZiAoIXRhIHx8IHRhLmxlbmd0aCAhPT0gMSkgcmV0dXJuIGdlbmVyaWNFdmVudDtcbiAgY29uc3QgZXZlbnRUeXBlID0gdGFbMF07XG5cbiAgcmV0dXJuIHsuLi5nZW5lcmljRXZlbnQsIHR5cGU6IGV2ZW50VHlwZX07XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc3ltYm9scyBhdmFpbGFibGUgaW4gYSBwYXJ0aWN1bGFyIHNjb3BlIG9mIGEgdGVtcGxhdGUuXG4gKiBAcGFyYW0gaW5mbyBwYXJzZWQgdGVtcGxhdGUgaW5mb3JtYXRpb25cbiAqIEBwYXJhbSBwYXRoIHBhdGggb2YgdGVtcGxhdGUgbm9kZXMgbmFycm93aW5nIHRvIHRoZSBjb250ZXh0IHRoZSBleHByZXNzaW9uIHNjb3BlIHNob3VsZCBiZVxuICogZGVyaXZlZCBmb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHByZXNzaW9uU2NvcGUoXG4gICAgaW5mbzogRGlhZ25vc3RpY1RlbXBsYXRlSW5mbywgcGF0aDogVGVtcGxhdGVBc3RQYXRoKTogU3ltYm9sVGFibGUge1xuICBsZXQgcmVzdWx0ID0gaW5mby5tZW1iZXJzO1xuICBjb25zdCByZWZlcmVuY2VzID0gZ2V0UmVmZXJlbmNlcyhpbmZvKTtcbiAgY29uc3QgdmFyaWFibGVzID0gZ2V0VmFyRGVjbGFyYXRpb25zKGluZm8sIHBhdGgpO1xuICBjb25zdCBldmVudCA9IGdldEV2ZW50RGVjbGFyYXRpb24oaW5mbywgcGF0aCk7XG4gIGlmIChyZWZlcmVuY2VzLmxlbmd0aCB8fCB2YXJpYWJsZXMubGVuZ3RoIHx8IGV2ZW50KSB7XG4gICAgY29uc3QgcmVmZXJlbmNlVGFibGUgPSBpbmZvLnF1ZXJ5LmNyZWF0ZVN5bWJvbFRhYmxlKHJlZmVyZW5jZXMpO1xuICAgIGNvbnN0IHZhcmlhYmxlVGFibGUgPSBpbmZvLnF1ZXJ5LmNyZWF0ZVN5bWJvbFRhYmxlKHZhcmlhYmxlcyk7XG4gICAgY29uc3QgZXZlbnRzVGFibGUgPSBpbmZvLnF1ZXJ5LmNyZWF0ZVN5bWJvbFRhYmxlKGV2ZW50ID8gW2V2ZW50XSA6IFtdKTtcbiAgICByZXN1bHQgPSBpbmZvLnF1ZXJ5Lm1lcmdlU3ltYm9sVGFibGUoW3Jlc3VsdCwgcmVmZXJlbmNlVGFibGUsIHZhcmlhYmxlVGFibGUsIGV2ZW50c1RhYmxlXSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuY2xhc3MgRXhwcmVzc2lvbkRpYWdub3N0aWNzVmlzaXRvciBleHRlbmRzIFJlY3Vyc2l2ZVRlbXBsYXRlQXN0VmlzaXRvciB7XG4gIHByaXZhdGUgcGF0aDogVGVtcGxhdGVBc3RQYXRoO1xuICBwcml2YXRlIGRpcmVjdGl2ZVN1bW1hcnk6IENvbXBpbGVEaXJlY3RpdmVTdW1tYXJ5fHVuZGVmaW5lZDtcblxuICBkaWFnbm9zdGljczogRGlhZ25vc3RpY1tdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIGluZm86IERpYWdub3N0aWNUZW1wbGF0ZUluZm8sXG4gICAgICBwcml2YXRlIGdldEV4cHJlc3Npb25TY29wZTogKHBhdGg6IFRlbXBsYXRlQXN0UGF0aCwgaW5jbHVkZUV2ZW50OiBib29sZWFuKSA9PiBTeW1ib2xUYWJsZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5wYXRoID0gbmV3IEFzdFBhdGg8VGVtcGxhdGVBc3Q+KFtdKTtcbiAgfVxuXG4gIHZpc2l0RGlyZWN0aXZlKGFzdDogRGlyZWN0aXZlQXN0LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIC8vIE92ZXJyaWRlIHRoZSBkZWZhdWx0IGNoaWxkIHZpc2l0b3IgdG8gaWdub3JlIHRoZSBob3N0IHByb3BlcnRpZXMgb2YgYSBkaXJlY3RpdmUuXG4gICAgaWYgKGFzdC5pbnB1dHMgJiYgYXN0LmlucHV0cy5sZW5ndGgpIHtcbiAgICAgIHRlbXBsYXRlVmlzaXRBbGwodGhpcywgYXN0LmlucHV0cywgY29udGV4dCk7XG4gICAgfVxuICB9XG5cbiAgdmlzaXRCb3VuZFRleHQoYXN0OiBCb3VuZFRleHRBc3QpOiB2b2lkIHtcbiAgICB0aGlzLnB1c2goYXN0KTtcbiAgICB0aGlzLmRpYWdub3NlRXhwcmVzc2lvbihhc3QudmFsdWUsIGFzdC5zb3VyY2VTcGFuLnN0YXJ0Lm9mZnNldCwgZmFsc2UpO1xuICAgIHRoaXMucG9wKCk7XG4gIH1cblxuICB2aXNpdERpcmVjdGl2ZVByb3BlcnR5KGFzdDogQm91bmREaXJlY3RpdmVQcm9wZXJ0eUFzdCk6IHZvaWQge1xuICAgIHRoaXMucHVzaChhc3QpO1xuICAgIHRoaXMuZGlhZ25vc2VFeHByZXNzaW9uKGFzdC52YWx1ZSwgdGhpcy5hdHRyaWJ1dGVWYWx1ZUxvY2F0aW9uKGFzdCksIGZhbHNlKTtcbiAgICB0aGlzLnBvcCgpO1xuICB9XG5cbiAgdmlzaXRFbGVtZW50UHJvcGVydHkoYXN0OiBCb3VuZEVsZW1lbnRQcm9wZXJ0eUFzdCk6IHZvaWQge1xuICAgIHRoaXMucHVzaChhc3QpO1xuICAgIHRoaXMuZGlhZ25vc2VFeHByZXNzaW9uKGFzdC52YWx1ZSwgdGhpcy5hdHRyaWJ1dGVWYWx1ZUxvY2F0aW9uKGFzdCksIGZhbHNlKTtcbiAgICB0aGlzLnBvcCgpO1xuICB9XG5cbiAgdmlzaXRFdmVudChhc3Q6IEJvdW5kRXZlbnRBc3QpOiB2b2lkIHtcbiAgICB0aGlzLnB1c2goYXN0KTtcbiAgICB0aGlzLmRpYWdub3NlRXhwcmVzc2lvbihhc3QuaGFuZGxlciwgdGhpcy5hdHRyaWJ1dGVWYWx1ZUxvY2F0aW9uKGFzdCksIHRydWUpO1xuICAgIHRoaXMucG9wKCk7XG4gIH1cblxuICB2aXNpdFZhcmlhYmxlKGFzdDogVmFyaWFibGVBc3QpOiB2b2lkIHtcbiAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLmRpcmVjdGl2ZVN1bW1hcnk7XG4gICAgaWYgKGRpcmVjdGl2ZSAmJiBhc3QudmFsdWUpIHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmluZm8ucXVlcnkuZ2V0VGVtcGxhdGVDb250ZXh0KGRpcmVjdGl2ZS50eXBlLnJlZmVyZW5jZSkgITtcbiAgICAgIGlmIChjb250ZXh0ICYmICFjb250ZXh0Lmhhcyhhc3QudmFsdWUpKSB7XG4gICAgICAgIGNvbnN0IG1pc3NpbmdNZW1iZXIgPVxuICAgICAgICAgICAgYXN0LnZhbHVlID09PSAnJGltcGxpY2l0JyA/ICdhbiBpbXBsaWNpdCB2YWx1ZScgOiBgYSBtZW1iZXIgY2FsbGVkICcke2FzdC52YWx1ZX0nYDtcbiAgICAgICAgdGhpcy5yZXBvcnREaWFnbm9zdGljKFxuICAgICAgICAgICAgYFRoZSB0ZW1wbGF0ZSBjb250ZXh0IG9mICcke2RpcmVjdGl2ZS50eXBlLnJlZmVyZW5jZS5uYW1lfScgZG9lcyBub3QgZGVmaW5lICR7bWlzc2luZ01lbWJlcn0uXFxuYCArXG4gICAgICAgICAgICAgICAgYElmIHRoZSBjb250ZXh0IHR5cGUgaXMgYSBiYXNlIHR5cGUgb3IgJ2FueScsIGNvbnNpZGVyIHJlZmluaW5nIGl0IHRvIGEgbW9yZSBzcGVjaWZpYyB0eXBlLmAsXG4gICAgICAgICAgICBzcGFuT2YoYXN0LnNvdXJjZVNwYW4pLCB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuU3VnZ2VzdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdmlzaXRFbGVtZW50KGFzdDogRWxlbWVudEFzdCwgY29udGV4dDogYW55KTogdm9pZCB7XG4gICAgdGhpcy5wdXNoKGFzdCk7XG4gICAgc3VwZXIudmlzaXRFbGVtZW50KGFzdCwgY29udGV4dCk7XG4gICAgdGhpcy5wb3AoKTtcbiAgfVxuXG4gIHZpc2l0RW1iZWRkZWRUZW1wbGF0ZShhc3Q6IEVtYmVkZGVkVGVtcGxhdGVBc3QsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgY29uc3QgcHJldmlvdXNEaXJlY3RpdmVTdW1tYXJ5ID0gdGhpcy5kaXJlY3RpdmVTdW1tYXJ5O1xuXG4gICAgdGhpcy5wdXNoKGFzdCk7XG5cbiAgICAvLyBGaW5kIGRpcmVjdGl2ZSB0aGF0IHJlZmVyZW5jZXMgdGhpcyB0ZW1wbGF0ZVxuICAgIHRoaXMuZGlyZWN0aXZlU3VtbWFyeSA9XG4gICAgICAgIGFzdC5kaXJlY3RpdmVzLm1hcChkID0+IGQuZGlyZWN0aXZlKS5maW5kKGQgPT4gaGFzVGVtcGxhdGVSZWZlcmVuY2UoZC50eXBlKSkgITtcblxuICAgIC8vIFByb2Nlc3MgY2hpbGRyZW5cbiAgICBzdXBlci52aXNpdEVtYmVkZGVkVGVtcGxhdGUoYXN0LCBjb250ZXh0KTtcblxuICAgIHRoaXMucG9wKCk7XG5cbiAgICB0aGlzLmRpcmVjdGl2ZVN1bW1hcnkgPSBwcmV2aW91c0RpcmVjdGl2ZVN1bW1hcnk7XG4gIH1cblxuICBwcml2YXRlIGF0dHJpYnV0ZVZhbHVlTG9jYXRpb24oYXN0OiBUZW1wbGF0ZUFzdCkge1xuICAgIGNvbnN0IHBhdGggPSBnZXRQYXRoVG9Ob2RlQXRQb3NpdGlvbih0aGlzLmluZm8uaHRtbEFzdCwgYXN0LnNvdXJjZVNwYW4uc3RhcnQub2Zmc2V0KTtcbiAgICBjb25zdCBsYXN0ID0gcGF0aC50YWlsO1xuICAgIGlmIChsYXN0IGluc3RhbmNlb2YgQXR0cmlidXRlICYmIGxhc3QudmFsdWVTcGFuKSB7XG4gICAgICByZXR1cm4gbGFzdC52YWx1ZVNwYW4uc3RhcnQub2Zmc2V0O1xuICAgIH1cbiAgICByZXR1cm4gYXN0LnNvdXJjZVNwYW4uc3RhcnQub2Zmc2V0O1xuICB9XG5cbiAgcHJpdmF0ZSBkaWFnbm9zZUV4cHJlc3Npb24oYXN0OiBBU1QsIG9mZnNldDogbnVtYmVyLCBldmVudDogYm9vbGVhbikge1xuICAgIGNvbnN0IHNjb3BlID0gdGhpcy5nZXRFeHByZXNzaW9uU2NvcGUodGhpcy5wYXRoLCBldmVudCk7XG4gICAgY29uc3QgYW5hbHl6ZXIgPSBuZXcgQXN0VHlwZShzY29wZSwgdGhpcy5pbmZvLnF1ZXJ5LCB7ZXZlbnR9KTtcbiAgICBmb3IgKGNvbnN0IHttZXNzYWdlLCBzcGFuLCBraW5kfSBvZiBhbmFseXplci5nZXREaWFnbm9zdGljcyhhc3QpKSB7XG4gICAgICBzcGFuLnN0YXJ0ICs9IG9mZnNldDtcbiAgICAgIHNwYW4uZW5kICs9IG9mZnNldDtcbiAgICAgIHRoaXMucmVwb3J0RGlhZ25vc3RpYyhtZXNzYWdlIGFzIHN0cmluZywgc3Bhbiwga2luZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwdXNoKGFzdDogVGVtcGxhdGVBc3QpIHsgdGhpcy5wYXRoLnB1c2goYXN0KTsgfVxuXG4gIHByaXZhdGUgcG9wKCkgeyB0aGlzLnBhdGgucG9wKCk7IH1cblxuICBwcml2YXRlIHJlcG9ydERpYWdub3N0aWMoXG4gICAgICBtZXNzYWdlOiBzdHJpbmcsIHNwYW46IFNwYW4sIGtpbmQ6IHRzLkRpYWdub3N0aWNDYXRlZ29yeSA9IHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcikge1xuICAgIHNwYW4uc3RhcnQgKz0gdGhpcy5pbmZvLm9mZnNldDtcbiAgICBzcGFuLmVuZCArPSB0aGlzLmluZm8ub2Zmc2V0O1xuICAgIHRoaXMuZGlhZ25vc3RpY3MucHVzaCh7a2luZCwgc3BhbiwgbWVzc2FnZX0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhc1RlbXBsYXRlUmVmZXJlbmNlKHR5cGU6IENvbXBpbGVUeXBlTWV0YWRhdGEpOiBib29sZWFuIHtcbiAgaWYgKHR5cGUuZGlEZXBzKSB7XG4gICAgZm9yIChsZXQgZGlEZXAgb2YgdHlwZS5kaURlcHMpIHtcbiAgICAgIGlmIChkaURlcC50b2tlbiAmJiBkaURlcC50b2tlbi5pZGVudGlmaWVyICYmXG4gICAgICAgICAgaWRlbnRpZmllck5hbWUoZGlEZXAudG9rZW4gIS5pZGVudGlmaWVyICEpID09ICdUZW1wbGF0ZVJlZicpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHNwYW5PZihzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4pOiBTcGFuIHtcbiAgcmV0dXJuIHtzdGFydDogc291cmNlU3Bhbi5zdGFydC5vZmZzZXQsIGVuZDogc291cmNlU3Bhbi5lbmQub2Zmc2V0fTtcbn1cbiJdfQ==