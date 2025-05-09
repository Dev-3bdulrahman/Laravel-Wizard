import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Check if the given path is a Laravel project
 * @param projectPath Path to check
 */
export function isLaravelProject(projectPath: string): boolean {
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
            if (
                (composerJson.require && composerJson.require['laravel/framework']) ||
                (composerJson['require-dev'] && composerJson['require-dev']['laravel/framework'])
            ) {
                return true;
            }
        } catch (error) {
            console.error('Error parsing composer.json:', error);
        }
    }

    return false;
}

/**
 * Find the Laravel project root directory
 * @param startPath Starting path to search from
 */
export async function findLaravelRoot(startPath: string): Promise<string | null> {
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
export function getLaravelConfig(laravelRoot: string): any {
    const config: any = {
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
export function getLaravelVersion(laravelRoot: string): string | null {
    const composerPath = path.join(laravelRoot, 'composer.json');
    if (fs.existsSync(composerPath)) {
        try {
            const composerContent = fs.readFileSync(composerPath, 'utf8');
            const composerJson = JSON.parse(composerContent);
            
            if (composerJson.require && composerJson.require['laravel/framework']) {
                return composerJson.require['laravel/framework'];
            }
        } catch (error) {
            console.error('Error parsing composer.json:', error);
        }
    }
    
    return null;
}

/**
 * Check if a file exists in the workspace
 * @param filePath Path to check
 */
export function fileExists(filePath: string): boolean {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

/**
 * Get all PHP files in a directory recursively
 * @param directory Directory to search
 * @param pattern File pattern to match
 */
export function getFilesRecursively(directory: string, pattern: string = '**/*.php'): string[] {
    try {
        if (!fs.existsSync(directory)) {
            return [];
        }
        
        const files: string[] = [];
        const entries = fs.readdirSync(directory, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            
            if (entry.isDirectory()) {
                files.push(...getFilesRecursively(fullPath, pattern));
            } else if (entry.isFile() && fullPath.match(pattern)) {
                files.push(fullPath);
            }
        }
        
        return files;
    } catch (error) {
        console.error('Error getting files recursively:', error);
        return [];
    }
}
