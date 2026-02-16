# Nx Configuration Reference

Complete configuration templates and options for Nx workspaces.

## nx.json Configuration

Full nx.json template with all common options:

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "npmScope": "myorg",
  "affected": {
    "defaultBase": "main"
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": [
          "build",
          "lint",
          "test",
          "e2e",
          "build-storybook"
        ],
        "parallel": 3
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"],
      "cache": true
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"],
      "cache": true
    },
    "e2e": {
      "inputs": ["default", "^production"],
      "cache": true
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json"
    ],
    "sharedGlobals": [
      "{workspaceRoot}/babel.config.json",
      "{workspaceRoot}/tsconfig.base.json"
    ]
  },
  "generators": {
    "@nx/react": {
      "application": {
        "style": "css",
        "linter": "eslint",
        "bundler": "webpack"
      },
      "library": {
        "style": "css",
        "linter": "eslint"
      }
    }
  }
}
```

## Project Configuration

Full project.json template:

```json
{
  "name": "web",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/web/src",
  "projectType": "application",
  "tags": ["type:app", "scope:web"],
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack",
      "outputs": ["{options.outputPath}"],
      "defaultConfiguration": "production",
      "options": {
        "compiler": "babel",
        "outputPath": "dist/apps/web",
        "index": "apps/web/src/index.html",
        "main": "apps/web/src/main.tsx",
        "tsConfig": "apps/web/tsconfig.app.json",
        "assets": ["apps/web/src/assets"],
        "styles": ["apps/web/src/styles.css"]
      },
      "configurations": {
        "development": {
          "extractLicenses": false,
          "optimization": false,
          "sourceMap": true
        },
        "production": {
          "optimization": true,
          "outputHashing": "all",
          "sourceMap": false,
          "extractLicenses": true
        }
      }
    },
    "serve": {
      "executor": "@nx/webpack:dev-server",
      "defaultConfiguration": "development",
      "options": {
        "buildTarget": "web:build"
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "apps/web/jest.config.ts",
        "passWithNoTests": true
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/web/**/*.{ts,tsx,js,jsx}"]
      }
    }
  }
}
```

## Module Boundary Rules

Complete .eslintrc.json configuration with module boundaries:

```json
{
  "root": true,
  "ignorePatterns": ["**/*"],
  "plugins": ["@nx"],
  "overrides": [
    {
      "files": ["*.ts", "*.tsx", "*.js", "*.jsx"],
      "rules": {
        "@nx/enforce-module-boundaries": [
          "error",
          {
            "enforceBuildableLibDependency": true,
            "allow": [],
            "depConstraints": [
              {
                "sourceTag": "type:app",
                "onlyDependOnLibsWithTags": [
                  "type:feature",
                  "type:ui",
                  "type:data-access",
                  "type:util"
                ]
              },
              {
                "sourceTag": "type:feature",
                "onlyDependOnLibsWithTags": [
                  "type:ui",
                  "type:data-access",
                  "type:util"
                ]
              },
              {
                "sourceTag": "type:ui",
                "onlyDependOnLibsWithTags": ["type:ui", "type:util"]
              },
              {
                "sourceTag": "type:data-access",
                "onlyDependOnLibsWithTags": ["type:data-access", "type:util"]
              },
              {
                "sourceTag": "type:util",
                "onlyDependOnLibsWithTags": ["type:util"]
              },
              {
                "sourceTag": "scope:web",
                "onlyDependOnLibsWithTags": ["scope:web", "scope:shared"]
              },
              {
                "sourceTag": "scope:api",
                "onlyDependOnLibsWithTags": ["scope:api", "scope:shared"]
              },
              {
                "sourceTag": "scope:shared",
                "onlyDependOnLibsWithTags": ["scope:shared"]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

## Remote Caching

### Nx Cloud Setup

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "cacheableOperations": ["build", "lint", "test", "e2e"],
        "accessToken": "your-nx-cloud-token",
        "parallel": 3,
        "cacheDirectory": ".nx/cache"
      }
    }
  },
  "nxCloudAccessToken": "your-nx-cloud-token"
}
```

### Self-Hosted Cache with S3

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nx-aws-cache/nx-aws-cache",
      "options": {
        "cacheableOperations": ["build", "lint", "test"],
        "awsRegion": "us-east-1",
        "awsBucket": "my-nx-cache-bucket",
        "awsProfile": "default"
      }
    }
  }
}
```

## Custom Generator Example

```typescript
// tools/generators/feature-lib/index.ts
import {
  Tree,
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  readProjectConfiguration,
} from "@nx/devkit";
import { libraryGenerator } from "@nx/react";

interface FeatureLibraryGeneratorSchema {
  name: string;
  scope: string;
  directory?: string;
}

export default async function featureLibraryGenerator(
  tree: Tree,
  options: FeatureLibraryGeneratorSchema,
) {
  const { name, scope, directory } = options;
  const projectDirectory = directory
    ? `${directory}/${name}`
    : `libs/${scope}/feature-${name}`;

  // Generate base library
  await libraryGenerator(tree, {
    name: `feature-${name}`,
    directory: projectDirectory,
    tags: `type:feature,scope:${scope}`,
    style: "css",
    skipTsConfig: false,
    skipFormat: true,
    unitTestRunner: "jest",
    linter: "eslint",
  });

  // Add custom files
  const projectConfig = readProjectConfiguration(
    tree,
    `${scope}-feature-${name}`,
  );
  const projectNames = names(name);

  generateFiles(
    tree,
    joinPathFragments(__dirname, "files"),
    projectConfig.sourceRoot,
    {
      ...projectNames,
      scope,
      tmpl: "",
    },
  );

  await formatFiles(tree);
}
```
