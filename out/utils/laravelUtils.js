"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLaravelProject = isLaravelProject;
exports.findLaravelRoot = findLaravelRoot;
exports.getLaravelConfig = getLaravelConfig;
exports.getLaravelVersion = getLaravelVersion;
exports.fileExists = fileExists;
exports.getFilesRecursively = getFilesRecursively;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Check if the given path is a Laravel project
 * @param projectPath Path to check
 */
function isLaravelProject(projectPath) {
    // Check for artisan file
    const artisanPath = path.join(projectPath, 'artisan');
    if (fs.existsSync(artisanPath)) {
        return true;
    }
    // Check for composer.json with laravel/framework dependency
    const composerPath = path.join(projectPath, 'composer.json');
    if (fs.existsSync(composerPath)) {
        try {
            const composerContent = fs.readFileSync(composerPath, 'utf8');
            const composerJson = JSON.parse(composerContent);
            // Check require or require-dev for laravel/framework
            if ((composerJson.require && composerJson.require['laravel/framework']) ||
                (composerJson['require-dev'] && composerJson['require-dev']['laravel/framework'])) {
                return true;
            }
        }
        catch (error) {
            console.error('Error parsing composer.json:', error);
        }
    }
    return false;
}
/**
 * Find the Laravel project root directory
 * @param startPath Starting path to search from
 */
async function findLaravelRoot(startPath) {
    let currentPath = startPath;
    // Maximum depth to search
    const maxDepth = 5;
    let depth = 0;
    while (currentPath && depth < maxDepth) {
        if (isLaravelProject(currentPath)) {
            return currentPath;
        }
        // Move up one directory
        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
            // We've reached the root
            break;
        }
        currentPath = parentPath;
        depth++;
    }
    return null;
}
/**
 * Get Laravel project configuration
 * @param laravelRoot Laravel project root path
 */
function getLaravelConfig(laravelRoot) {
    const config = {
        root: laravelRoot,
        appPath: path.join(laravelRoot, 'app'),
        configPath: path.join(laravelRoot, 'config'),
        routesPath: path.join(laravelRoot, 'routes'),
        viewsPath: path.join(laravelRoot, 'resources', 'views'),
        migrationsPath: path.join(laravelRoot, 'database', 'migrations'),
        modelsPath: path.join(laravelRoot, 'app', 'Models'),
        controllersPath: path.join(laravelRoot, 'app', 'Http', 'Controllers'),
        livewirePath: path.join(laravelRoot, 'app', 'Livewire'),
        filamentPath: path.join(laravelRoot, 'app', 'Filament')
    };
    return config;
}
/**
 * Get Laravel version from composer.json
 * @param laravelRoot Laravel project root path
 */
function getLaravelVersion(laravelRoot) {
    const composerPath = path.join(laravelRoot, 'composer.json');
    if (fs.existsSync(composerPath)) {
        try {
            const composerContent = fs.readFileSync(composerPath, 'utf8');
            const composerJson = JSON.parse(composerContent);
            if (composerJson.require && composerJson.require['laravel/framework']) {
                return composerJson.require['laravel/framework'];
            }
        }
        catch (error) {
            console.error('Error parsing composer.json:', error);
        }
    }
    return null;
}
/**
 * Check if a file exists in the workspace
 * @param filePath Path to check
 */
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    }
    catch (error) {
        return false;
    }
}
/**
 * Get all PHP files in a directory recursively
 * @param directory Directory to search
 * @param pattern File pattern to match
 */
function getFilesRecursively(directory, pattern = '**/*.php') {
    try {
        if (!fs.existsSync(directory)) {
            return [];
        }
        const files = [];
        const entries = fs.readdirSync(directory, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                files.push(...getFilesRecursively(fullPath, pattern));
            }
            else if (entry.isFile() && fullPath.match(pattern)) {
                files.push(fullPath);
            }
        }
        return files;
    }
    catch (error) {
        console.error('Error getting files recursively:', error);
        return [];
    }
}
//# sourceMappingURL=laravelUtils.js.map