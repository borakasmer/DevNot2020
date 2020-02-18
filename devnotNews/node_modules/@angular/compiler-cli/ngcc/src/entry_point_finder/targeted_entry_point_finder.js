(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/ngcc/src/entry_point_finder/targeted_entry_point_finder", ["require", "exports", "tslib", "@angular/compiler-cli/src/ngtsc/file_system", "@angular/compiler-cli/ngcc/src/packages/build_marker", "@angular/compiler-cli/ngcc/src/packages/entry_point", "@angular/compiler-cli/ngcc/src/entry_point_finder/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system");
    var build_marker_1 = require("@angular/compiler-cli/ngcc/src/packages/build_marker");
    var entry_point_1 = require("@angular/compiler-cli/ngcc/src/packages/entry_point");
    var utils_1 = require("@angular/compiler-cli/ngcc/src/entry_point_finder/utils");
    /**
     * An EntryPointFinder that starts from a target entry-point and only finds
     * entry-points that are dependencies of the target.
     *
     * This is faster than searching the entire file-system for all the entry-points,
     * and is used primarily by the CLI integration.
     */
    var TargetedEntryPointFinder = /** @class */ (function () {
        function TargetedEntryPointFinder(fs, config, logger, resolver, basePath, targetPath, pathMappings) {
            this.fs = fs;
            this.config = config;
            this.logger = logger;
            this.resolver = resolver;
            this.basePath = basePath;
            this.targetPath = targetPath;
            this.pathMappings = pathMappings;
            this.unprocessedPaths = [];
            this.unsortedEntryPoints = new Map();
            this.basePaths = utils_1.getBasePaths(this.basePath, this.pathMappings);
        }
        TargetedEntryPointFinder.prototype.findEntryPoints = function () {
            var _this = this;
            this.unprocessedPaths = [this.targetPath];
            while (this.unprocessedPaths.length > 0) {
                this.processNextPath();
            }
            var targetEntryPoint = this.unsortedEntryPoints.get(this.targetPath);
            var entryPoints = this.resolver.sortEntryPointsByDependency(Array.from(this.unsortedEntryPoints.values()), targetEntryPoint);
            var invalidTarget = entryPoints.invalidEntryPoints.find(function (i) { return i.entryPoint.path === _this.targetPath; });
            if (invalidTarget !== undefined) {
                throw new Error("The target entry-point \"" + invalidTarget.entryPoint.name + "\" has missing dependencies:\n" +
                    invalidTarget.missingDependencies.map(function (dep) { return " - " + dep + "\n"; }).join(''));
            }
            return entryPoints;
        };
        TargetedEntryPointFinder.prototype.targetNeedsProcessingOrCleaning = function (propertiesToConsider, compileAllFormats) {
            var e_1, _a;
            var entryPoint = this.getEntryPoint(this.targetPath);
            if (entryPoint === null || !entryPoint.compiledByAngular) {
                return false;
            }
            try {
                for (var propertiesToConsider_1 = tslib_1.__values(propertiesToConsider), propertiesToConsider_1_1 = propertiesToConsider_1.next(); !propertiesToConsider_1_1.done; propertiesToConsider_1_1 = propertiesToConsider_1.next()) {
                    var property = propertiesToConsider_1_1.value;
                    if (entryPoint.packageJson[property]) {
                        // Here is a property that should be processed.
                        if (!build_marker_1.hasBeenProcessed(entryPoint.packageJson, property)) {
                            return true;
                        }
                        if (!compileAllFormats) {
                            // This property has been processed, and we only need one.
                            return false;
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (propertiesToConsider_1_1 && !propertiesToConsider_1_1.done && (_a = propertiesToConsider_1.return)) _a.call(propertiesToConsider_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // All `propertiesToConsider` that appear in this entry-point have been processed.
            // In other words, there were no properties that need processing.
            return false;
        };
        TargetedEntryPointFinder.prototype.processNextPath = function () {
            var _this = this;
            var path = this.unprocessedPaths.shift();
            var entryPoint = this.getEntryPoint(path);
            if (entryPoint !== null && entryPoint.compiledByAngular) {
                this.unsortedEntryPoints.set(entryPoint.path, entryPoint);
                var deps = this.resolver.getEntryPointDependencies(entryPoint);
                deps.dependencies.forEach(function (dep) {
                    if (!_this.unsortedEntryPoints.has(dep)) {
                        _this.unprocessedPaths.push(dep);
                    }
                });
            }
        };
        TargetedEntryPointFinder.prototype.getEntryPoint = function (entryPointPath) {
            var packagePath = this.computePackagePath(entryPointPath);
            return entry_point_1.getEntryPointInfo(this.fs, this.config, this.logger, packagePath, entryPointPath);
        };
        /**
         * Search down to the `entryPointPath` from each `basePath` for the first `package.json` that we
         * come to. This is the path to the entry-point's containing package. For example if `basePath` is
         * `/a/b/c` and `entryPointPath` is `/a/b/c/d/e` and there exists `/a/b/c/d/package.json` and
         * `/a/b/c/d/e/package.json`, then we will return `/a/b/c/d`.
         *
         * To account for nested `node_modules` we actually start the search at the last `node_modules` in
         * the `entryPointPath` that is below the `basePath`. E.g. if `basePath` is `/a/b/c` and
         * `entryPointPath` is `/a/b/c/d/node_modules/x/y/z`, we start the search at
         * `/a/b/c/d/node_modules`.
         */
        TargetedEntryPointFinder.prototype.computePackagePath = function (entryPointPath) {
            var e_2, _a, e_3, _b;
            try {
                for (var _c = tslib_1.__values(this.basePaths), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var basePath = _d.value;
                    if (entryPointPath.startsWith(basePath)) {
                        var packagePath = basePath;
                        var segments = this.splitPath(file_system_1.relative(basePath, entryPointPath));
                        // Start the search at the last nested `node_modules` folder if the relative
                        // `entryPointPath` contains one or more.
                        var nodeModulesIndex = segments.lastIndexOf(file_system_1.relativeFrom('node_modules'));
                        while (nodeModulesIndex >= 0) {
                            packagePath = file_system_1.join(packagePath, segments.shift());
                            nodeModulesIndex--;
                        }
                        try {
                            // Note that we skip the first `packagePath` and start looking from the first folder below
                            // it because that will be the `node_modules` folder.
                            for (var segments_1 = (e_3 = void 0, tslib_1.__values(segments)), segments_1_1 = segments_1.next(); !segments_1_1.done; segments_1_1 = segments_1.next()) {
                                var segment = segments_1_1.value;
                                packagePath = file_system_1.join(packagePath, segment);
                                if (this.fs.exists(file_system_1.join(packagePath, 'package.json'))) {
                                    return packagePath;
                                }
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (segments_1_1 && !segments_1_1.done && (_b = segments_1.return)) _b.call(segments_1);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                        // If we got here then we couldn't find a `packagePath` for the current `basePath` but since
                        // `basePath`s are guaranteed not to be a sub-directory each other then no other `basePath`
                        // will match either.
                        break;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_2) throw e_2.error; }
            }
            // If we get here then none of the `basePaths` matched the `entryPointPath`, which
            // is somewhat unexpected and means that this entry-point lives completely outside
            // any of the `basePaths`.
            // All we can do is assume that his entry-point is a primary entry-point to a package.
            return entryPointPath;
        };
        /**
         * Split the given `path` into path segments using an FS independent algorithm.
         * @param path The path to split.
         */
        TargetedEntryPointFinder.prototype.splitPath = function (path) {
            var segments = [];
            while (path !== '.') {
                segments.unshift(this.fs.basename(path));
                path = this.fs.dirname(path);
            }
            return segments;
        };
        return TargetedEntryPointFinder;
    }());
    exports.TargetedEntryPointFinder = TargetedEntryPointFinder;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFyZ2V0ZWRfZW50cnlfcG9pbnRfZmluZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL25nY2Mvc3JjL2VudHJ5X3BvaW50X2ZpbmRlci90YXJnZXRlZF9lbnRyeV9wb2ludF9maW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0lBQUE7Ozs7OztPQU1HO0lBQ0gsMkVBQXFIO0lBR3JILHFGQUEwRDtJQUUxRCxtRkFBOEY7SUFHOUYsaUZBQXFDO0lBRXJDOzs7Ozs7T0FNRztJQUNIO1FBS0Usa0NBQ1ksRUFBYyxFQUFVLE1BQXlCLEVBQVUsTUFBYyxFQUN6RSxRQUE0QixFQUFVLFFBQXdCLEVBQzlELFVBQTBCLEVBQVUsWUFBb0M7WUFGeEUsT0FBRSxHQUFGLEVBQUUsQ0FBWTtZQUFVLFdBQU0sR0FBTixNQUFNLENBQW1CO1lBQVUsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUN6RSxhQUFRLEdBQVIsUUFBUSxDQUFvQjtZQUFVLGFBQVEsR0FBUixRQUFRLENBQWdCO1lBQzlELGVBQVUsR0FBVixVQUFVLENBQWdCO1lBQVUsaUJBQVksR0FBWixZQUFZLENBQXdCO1lBUDVFLHFCQUFnQixHQUFxQixFQUFFLENBQUM7WUFDeEMsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQThCLENBQUM7WUFDNUQsY0FBUyxHQUFHLG9CQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFLb0IsQ0FBQztRQUV4RixrREFBZSxHQUFmO1lBQUEsaUJBaUJDO1lBaEJDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMxQyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7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QUMsQ0FBQyxFQUFFO29DQUNyRCxPQUFPLFdBQVcsQ0FBQztpQ0FDcEI7NkJBQ0Y7Ozs7Ozs7Ozt3QkFFRCw0RkFBNEY7d0JBQzVGLDJGQUEyRjt3QkFDM0YscUJBQXFCO3dCQUNyQixNQUFNO3FCQUNQO2lCQUNGOzs7Ozs7Ozs7WUFDRCxrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLDBCQUEwQjtZQUMxQixzRkFBc0Y7WUFDdEYsT0FBTyxjQUFjLENBQUM7UUFDeEIsQ0FBQztRQUdEOzs7V0FHRztRQUNLLDRDQUFTLEdBQWpCLFVBQWtCLElBQWlCO1lBQ2pDLElBQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUNwQixPQUFPLElBQUksS0FBSyxHQUFHLEVBQUU7Z0JBQ25CLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDekMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzlCO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDbEIsQ0FBQztRQUNILCtCQUFDO0lBQUQsQ0FBQyxBQXBJRCxJQW9JQztJQXBJWSw0REFBd0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0Fic29sdXRlRnNQYXRoLCBGaWxlU3lzdGVtLCBQYXRoU2VnbWVudCwgam9pbiwgcmVsYXRpdmUsIHJlbGF0aXZlRnJvbX0gZnJvbSAnLi4vLi4vLi4vc3JjL25ndHNjL2ZpbGVfc3lzdGVtJztcbmltcG9ydCB7RGVwZW5kZW5jeVJlc29sdmVyLCBTb3J0ZWRFbnRyeVBvaW50c0luZm99IGZyb20gJy4uL2RlcGVuZGVuY2llcy9kZXBlbmRlbmN5X3Jlc29sdmVyJztcbmltcG9ydCB7TG9nZ2VyfSBmcm9tICcuLi9sb2dnaW5nL2xvZ2dlcic7XG5pbXBvcnQge2hhc0JlZW5Qcm9jZXNzZWR9IGZyb20gJy4uL3BhY2thZ2VzL2J1aWxkX21hcmtlcic7XG5pbXBvcnQge05nY2NDb25maWd1cmF0aW9ufSBmcm9tICcuLi9wYWNrYWdlcy9jb25maWd1cmF0aW9uJztcbmltcG9ydCB7RW50cnlQb2ludCwgRW50cnlQb2ludEpzb25Qcm9wZXJ0eSwgZ2V0RW50cnlQb2ludEluZm99IGZyb20gJy4uL3BhY2thZ2VzL2VudHJ5X3BvaW50JztcbmltcG9ydCB7UGF0aE1hcHBpbmdzfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge0VudHJ5UG9pbnRGaW5kZXJ9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7Z2V0QmFzZVBhdGhzfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBBbiBFbnRyeVBvaW50RmluZGVyIHRoYXQgc3RhcnRzIGZyb20gYSB0YXJnZXQgZW50cnktcG9pbnQgYW5kIG9ubHkgZmluZHNcbiAqIGVudHJ5LXBvaW50cyB0aGF0IGFyZSBkZXBlbmRlbmNpZXMgb2YgdGhlIHRhcmdldC5cbiAqXG4gKiBUaGlzIGlzIGZhc3RlciB0aGFuIHNlYXJjaGluZyB0aGUgZW50aXJlIGZpbGUtc3lzdGVtIGZvciBhbGwgdGhlIGVudHJ5LXBvaW50cyxcbiAqIGFuZCBpcyB1c2VkIHByaW1hcmlseSBieSB0aGUgQ0xJIGludGVncmF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgVGFyZ2V0ZWRFbnRyeVBvaW50RmluZGVyIGltcGxlbWVudHMgRW50cnlQb2ludEZpbmRlciB7XG4gIHByaXZhdGUgdW5wcm9jZXNzZWRQYXRoczogQWJzb2x1dGVGc1BhdGhbXSA9IFtdO1xuICBwcml2YXRlIHVuc29ydGVkRW50cnlQb2ludHMgPSBuZXcgTWFwPEFic29sdXRlRnNQYXRoLCBFbnRyeVBvaW50PigpO1xuICBwcml2YXRlIGJhc2VQYXRocyA9IGdldEJhc2VQYXRocyh0aGlzLmJhc2VQYXRoLCB0aGlzLnBhdGhNYXBwaW5ncyk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIGZzOiBGaWxlU3lzdGVtLCBwcml2YXRlIGNvbmZpZzogTmdjY0NvbmZpZ3VyYXRpb24sIHByaXZhdGUgbG9nZ2VyOiBMb2dnZXIsXG4gICAgICBwcml2YXRlIHJlc29sdmVyOiBEZXBlbmRlbmN5UmVzb2x2ZXIsIHByaXZhdGUgYmFzZVBhdGg6IEFic29sdXRlRnNQYXRoLFxuICAgICAgcHJpdmF0ZSB0YXJnZXRQYXRoOiBBYnNvbHV0ZUZzUGF0aCwgcHJpdmF0ZSBwYXRoTWFwcGluZ3M6IFBhdGhNYXBwaW5nc3x1bmRlZmluZWQpIHt9XG5cbiAgZmluZEVudHJ5UG9pbnRzKCk6IFNvcnRlZEVudHJ5UG9pbnRzSW5mbyB7XG4gICAgdGhpcy51bnByb2Nlc3NlZFBhdGhzID0gW3RoaXMudGFyZ2V0UGF0aF07XG4gICAgd2hpbGUgKHRoaXMudW5wcm9jZXNzZWRQYXRocy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnByb2Nlc3NOZXh0UGF0aCgpO1xuICAgIH1cbiAgICBjb25zdCB0YXJnZXRFbnRyeVBvaW50ID0gdGhpcy51bnNvcnRlZEVudHJ5UG9pbnRzLmdldCh0aGlzLnRhcmdldFBhdGgpO1xuICAgIGNvbnN0IGVudHJ5UG9pbnRzID0gdGhpcy5yZXNvbHZlci5zb3J0RW50cnlQb2ludHNCeURlcGVuZGVuY3koXG4gICAgICAgIEFycmF5LmZyb20odGhpcy51bnNvcnRlZEVudHJ5UG9pbnRzLnZhbHVlcygpKSwgdGFyZ2V0RW50cnlQb2ludCk7XG5cbiAgICBjb25zdCBpbnZhbGlkVGFyZ2V0ID1cbiAgICAgICAgZW50cnlQb2ludHMuaW52YWxpZEVudHJ5UG9pbnRzLmZpbmQoaSA9PiBpLmVudHJ5UG9pbnQucGF0aCA9PT0gdGhpcy50YXJnZXRQYXRoKTtcbiAgICBpZiAoaW52YWxpZFRhcmdldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFRoZSB0YXJnZXQgZW50cnktcG9pbnQgXCIke2ludmFsaWRUYXJnZXQuZW50cnlQb2ludC5uYW1lfVwiIGhhcyBtaXNzaW5nIGRlcGVuZGVuY2llczpcXG5gICtcbiAgICAgICAgICBpbnZhbGlkVGFyZ2V0Lm1pc3NpbmdEZXBlbmRlbmNpZXMubWFwKGRlcCA9PiBgIC0gJHtkZXB9XFxuYCkuam9pbignJykpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cnlQb2ludHM7XG4gIH1cblxuICB0YXJnZXROZWVkc1Byb2Nlc3NpbmdPckNsZWFuaW5nKFxuICAgICAgcHJvcGVydGllc1RvQ29uc2lkZXI6IEVudHJ5UG9pbnRKc29uUHJvcGVydHlbXSwgY29tcGlsZUFsbEZvcm1hdHM6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICBjb25zdCBlbnRyeVBvaW50ID0gdGhpcy5nZXRFbnRyeVBvaW50KHRoaXMudGFyZ2V0UGF0aCk7XG4gICAgaWYgKGVudHJ5UG9pbnQgPT09IG51bGwgfHwgIWVudHJ5UG9pbnQuY29tcGlsZWRCeUFuZ3VsYXIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHByb3BlcnR5IG9mIHByb3BlcnRpZXNUb0NvbnNpZGVyKSB7XG4gICAgICBpZiAoZW50cnlQb2ludC5wYWNrYWdlSnNvbltwcm9wZXJ0eV0pIHtcbiAgICAgICAgLy8gSGVyZSBpcyBhIHByb3BlcnR5IHRoYXQgc2hvdWxkIGJlIHByb2Nlc3NlZC5cbiAgICAgICAgaWYgKCFoYXNCZWVuUHJvY2Vzc2VkKGVudHJ5UG9pbnQucGFja2FnZUpzb24sIHByb3BlcnR5KSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY29tcGlsZUFsbEZvcm1hdHMpIHtcbiAgICAgICAgICAvLyBUaGlzIHByb3BlcnR5IGhhcyBiZWVuIHByb2Nlc3NlZCwgYW5kIHdlIG9ubHkgbmVlZCBvbmUuXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEFsbCBgcHJvcGVydGllc1RvQ29uc2lkZXJgIHRoYXQgYXBwZWFyIGluIHRoaXMgZW50cnktcG9pbnQgaGF2ZSBiZWVuIHByb2Nlc3NlZC5cbiAgICAvLyBJbiBvdGhlciB3b3JkcywgdGhlcmUgd2VyZSBubyBwcm9wZXJ0aWVzIHRoYXQgbmVlZCBwcm9jZXNzaW5nLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgcHJvY2Vzc05leHRQYXRoKCk6IHZvaWQge1xuICAgIGNvbnN0IHBhdGggPSB0aGlzLnVucHJvY2Vzc2VkUGF0aHMuc2hpZnQoKSAhO1xuICAgIGNvbnN0IGVudHJ5UG9pbnQgPSB0aGlzLmdldEVudHJ5UG9pbnQocGF0aCk7XG4gICAgaWYgKGVudHJ5UG9pbnQgIT09IG51bGwgJiYgZW50cnlQb2ludC5jb21waWxlZEJ5QW5ndWxhcikge1xuICAgICAgdGhpcy51bnNvcnRlZEVudHJ5UG9pbnRzLnNldChlbnRyeVBvaW50LnBhdGgsIGVudHJ5UG9pbnQpO1xuICAgICAgY29uc3QgZGVwcyA9IHRoaXMucmVzb2x2ZXIuZ2V0RW50cnlQb2ludERlcGVuZGVuY2llcyhlbnRyeVBvaW50KTtcbiAgICAgIGRlcHMuZGVwZW5kZW5jaWVzLmZvckVhY2goZGVwID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLnVuc29ydGVkRW50cnlQb2ludHMuaGFzKGRlcCkpIHtcbiAgICAgICAgICB0aGlzLnVucHJvY2Vzc2VkUGF0aHMucHVzaChkZXApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEVudHJ5UG9pbnQoZW50cnlQb2ludFBhdGg6IEFic29sdXRlRnNQYXRoKTogRW50cnlQb2ludHxudWxsIHtcbiAgICBjb25zdCBwYWNrYWdlUGF0aCA9IHRoaXMuY29tcHV0ZVBhY2thZ2VQYXRoKGVudHJ5UG9pbnRQYXRoKTtcbiAgICByZXR1cm4gZ2V0RW50cnlQb2ludEluZm8odGhpcy5mcywgdGhpcy5jb25maWcsIHRoaXMubG9nZ2VyLCBwYWNrYWdlUGF0aCwgZW50cnlQb2ludFBhdGgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaCBkb3duIHRvIHRoZSBgZW50cnlQb2ludFBhdGhgIGZyb20gZWFjaCBgYmFzZVBhdGhgIGZvciB0aGUgZmlyc3QgYHBhY2thZ2UuanNvbmAgdGhhdCB3ZVxuICAgKiBjb21lIHRvLiBUaGlzIGlzIHRoZSBwYXRoIHRvIHRoZSBlbnRyeS1wb2ludCdzIGNvbnRhaW5pbmcgcGFja2FnZS4gRm9yIGV4YW1wbGUgaWYgYGJhc2VQYXRoYCBpc1xuICAgKiBgL2EvYi9jYCBhbmQgYGVudHJ5UG9pbnRQYXRoYCBpcyBgL2EvYi9jL2QvZWAgYW5kIHRoZXJlIGV4aXN0cyBgL2EvYi9jL2QvcGFja2FnZS5qc29uYCBhbmRcbiAgICogYC9hL2IvYy9kL2UvcGFja2FnZS5qc29uYCwgdGhlbiB3ZSB3aWxsIHJldHVybiBgL2EvYi9jL2RgLlxuICAgKlxuICAgKiBUbyBhY2NvdW50IGZvciBuZXN0ZWQgYG5vZGVfbW9kdWxlc2Agd2UgYWN0dWFsbHkgc3RhcnQgdGhlIHNlYXJjaCBhdCB0aGUgbGFzdCBgbm9kZV9tb2R1bGVzYCBpblxuICAgKiB0aGUgYGVudHJ5UG9pbnRQYXRoYCB0aGF0IGlzIGJlbG93IHRoZSBgYmFzZVBhdGhgLiBFLmcuIGlmIGBiYXNlUGF0aGAgaXMgYC9hL2IvY2AgYW5kXG4gICAqIGBlbnRyeVBvaW50UGF0aGAgaXMgYC9hL2IvYy9kL25vZGVfbW9kdWxlcy94L3kvemAsIHdlIHN0YXJ0IHRoZSBzZWFyY2ggYXRcbiAgICogYC9hL2IvYy9kL25vZGVfbW9kdWxlc2AuXG4gICAqL1xuICBwcml2YXRlIGNvbXB1dGVQYWNrYWdlUGF0aChlbnRyeVBvaW50UGF0aDogQWJzb2x1dGVGc1BhdGgpOiBBYnNvbHV0ZUZzUGF0aCB7XG4gICAgZm9yIChjb25zdCBiYXNlUGF0aCBvZiB0aGlzLmJhc2VQYXRocykge1xuICAgICAgaWYgKGVudHJ5UG9pbnRQYXRoLnN0YXJ0c1dpdGgoYmFzZVBhdGgpKSB7XG4gICAgICAgIGxldCBwYWNrYWdlUGF0aCA9IGJhc2VQYXRoO1xuICAgICAgICBjb25zdCBzZWdtZW50cyA9IHRoaXMuc3BsaXRQYXRoKHJlbGF0aXZlKGJhc2VQYXRoLCBlbnRyeVBvaW50UGF0aCkpO1xuXG4gICAgICAgIC8vIFN0YXJ0IHRoZSBzZWFyY2ggYXQgdGhlIGxhc3QgbmVzdGVkIGBub2RlX21vZHVsZXNgIGZvbGRlciBpZiB0aGUgcmVsYXRpdmVcbiAgICAgICAgLy8gYGVudHJ5UG9pbnRQYXRoYCBjb250YWlucyBvbmUgb3IgbW9yZS5cbiAgICAgICAgbGV0IG5vZGVNb2R1bGVzSW5kZXggPSBzZWdtZW50cy5sYXN0SW5kZXhPZihyZWxhdGl2ZUZyb20oJ25vZGVfbW9kdWxlcycpKTtcbiAgICAgICAgd2hpbGUgKG5vZGVNb2R1bGVzSW5kZXggPj0gMCkge1xuICAgICAgICAgIHBhY2thZ2VQYXRoID0gam9pbihwYWNrYWdlUGF0aCwgc2VnbWVudHMuc2hpZnQoKSAhKTtcbiAgICAgICAgICBub2RlTW9kdWxlc0luZGV4LS07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOb3RlIHRoYXQgd2Ugc2tpcCB0aGUgZmlyc3QgYHBhY2thZ2VQYXRoYCBhbmQgc3RhcnQgbG9va2luZyBmcm9tIHRoZSBmaXJzdCBmb2xkZXIgYmVsb3dcbiAgICAgICAgLy8gaXQgYmVjYXVzZSB0aGF0IHdpbGwgYmUgdGhlIGBub2RlX21vZHVsZXNgIGZvbGRlci5cbiAgICAgICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKSB7XG4gICAgICAgICAgcGFja2FnZVBhdGggPSBqb2luKHBhY2thZ2VQYXRoLCBzZWdtZW50KTtcbiAgICAgICAgICBpZiAodGhpcy5mcy5leGlzdHMoam9pbihwYWNrYWdlUGF0aCwgJ3BhY2thZ2UuanNvbicpKSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhY2thZ2VQYXRoO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIGdvdCBoZXJlIHRoZW4gd2UgY291bGRuJ3QgZmluZCBhIGBwYWNrYWdlUGF0aGAgZm9yIHRoZSBjdXJyZW50IGBiYXNlUGF0aGAgYnV0IHNpbmNlXG4gICAgICAgIC8vIGBiYXNlUGF0aGBzIGFyZSBndWFyYW50ZWVkIG5vdCB0byBiZSBhIHN1Yi1kaXJlY3RvcnkgZWFjaCBvdGhlciB0aGVuIG5vIG90aGVyIGBiYXNlUGF0aGBcbiAgICAgICAgLy8gd2lsbCBtYXRjaCBlaXRoZXIuXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIG5vbmUgb2YgdGhlIGBiYXNlUGF0aHNgIG1hdGNoZWQgdGhlIGBlbnRyeVBvaW50UGF0aGAsIHdoaWNoXG4gICAgLy8gaXMgc29tZXdoYXQgdW5leHBlY3RlZCBhbmQgbWVhbnMgdGhhdCB0aGlzIGVudHJ5LXBvaW50IGxpdmVzIGNvbXBsZXRlbHkgb3V0c2lkZVxuICAgIC8vIGFueSBvZiB0aGUgYGJhc2VQYXRoc2AuXG4gICAgLy8gQWxsIHdlIGNhbiBkbyBpcyBhc3N1bWUgdGhhdCBoaXMgZW50cnktcG9pbnQgaXMgYSBwcmltYXJ5IGVudHJ5LXBvaW50IHRvIGEgcGFja2FnZS5cbiAgICByZXR1cm4gZW50cnlQb2ludFBhdGg7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBTcGxpdCB0aGUgZ2l2ZW4gYHBhdGhgIGludG8gcGF0aCBzZWdtZW50cyB1c2luZyBhbiBGUyBpbmRlcGVuZGVudCBhbGdvcml0aG0uXG4gICAqIEBwYXJhbSBwYXRoIFRoZSBwYXRoIHRvIHNwbGl0LlxuICAgKi9cbiAgcHJpdmF0ZSBzcGxpdFBhdGgocGF0aDogUGF0aFNlZ21lbnQpIHtcbiAgICBjb25zdCBzZWdtZW50cyA9IFtdO1xuICAgIHdoaWxlIChwYXRoICE9PSAnLicpIHtcbiAgICAgIHNlZ21lbnRzLnVuc2hpZnQodGhpcy5mcy5iYXNlbmFtZShwYXRoKSk7XG4gICAgICBwYXRoID0gdGhpcy5mcy5kaXJuYW1lKHBhdGgpO1xuICAgIH1cbiAgICByZXR1cm4gc2VnbWVudHM7XG4gIH1cbn1cbiJdfQ==